"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { LogDisplay, LogEntry } from "./ui/LogDisplay";
import { CollapsibleCard } from "@/components/ui";

interface MacroEvent {
  type: string;
  ts_delta_ms: number;
  key?: string;
  clipboard_text?: string;
  delay_ms?: number;
  window_title?: string;
}

export function KeyLogPanel() {
  const [isRecording, setIsRecording] = useState(false);
  const [events, setEvents] = useState<MacroEvent[]>([]);
  const [macroName, setMacroName] = useState("");
  const [statusMessage, setStatusMessage] = useState("Idle");
  const [isSaving, setIsSaving] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const eventLogs = useMemo<LogEntry[]>(() => {
    let cumulativeTime = Date.now() - events.reduce((sum, e) => sum + e.ts_delta_ms, 0);
    return events.map((event) => {
      cumulativeTime += event.ts_delta_ms;
      const level: LogEntry["level"] = event.type === "ClipboardSet" ? "clipboard" : "key";
      let message: string;
      if (event.type === "ClipboardSet") {
        const preview = event.clipboard_text
          ? event.clipboard_text.slice(0, 50) + (event.clipboard_text.length > 50 ? "..." : "")
          : "";
        message = "Clipboard: " + preview;
      } else if (event.type === "KeyDown" || event.type === "KeyUp") {
        message = event.type + ": " + (event.key || "unknown");
      } else if (event.type === "Delay") {
        message = "Delay: " + event.delay_ms + "ms";
      } else {
        message = event.type + ": " + (event.key || event.clipboard_text || "");
      }
      return { timestamp: new Date(cumulativeTime).toISOString(), level, message, source: "keylogger" };
    });
  }, [events]);

  const clearEvents = () => { setEvents([]); setStatusMessage("Idle"); };

  const connectToEventStream = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    try {
      const streamUrl = api.getRecordingStreamUrl();
      console.log("[KeyLogPanel] Connecting to SSE:", streamUrl);
      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;
      eventSource.onmessage = (event) => {
        try {
          console.log("[KeyLogPanel] SSE message:", event.data);
          const data = JSON.parse(event.data);
          if (data.type === "done") {
            console.log("[KeyLogPanel] SSE done event, closing");
            eventSource.close();
            eventSourceRef.current = null;
            return;
          }
          setEvents((prev) => [...prev, data]);
        } catch (e) { console.error("[KeyLogPanel] Failed to parse SSE event:", e); }
      };
      eventSource.onerror = (error) => {
        console.error("[KeyLogPanel] SSE connection error:", error);
        console.log("[KeyLogPanel] EventSource readyState:", eventSource.readyState);
      };
      eventSource.onopen = () => { console.log("[KeyLogPanel] SSE connection opened"); };
    } catch (error) { console.error("[KeyLogPanel] Failed to create EventSource:", error); }
  };

  const handleStartRecording = async () => {
    try {
      setStatusMessage("Starting...");
      await api.startRecording();
      setIsRecording(true);
      setEvents([]);
      setMacroName("");
      setStatusMessage("Recording...");
      connectToEventStream();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start recording";
      setStatusMessage("Error: " + errorMessage);
      setIsRecording(false);
      console.error("Failed to start recording:", error);
    }
  };

  const handleStopRecording = async () => {
    try {
      setStatusMessage("Stopping...");
      if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
      const response = await api.stopRecording();
      setIsRecording(false);
      if (events.length > 0) {
        setStatusMessage("Stopped - " + events.length + " events captured");
      } else if (response.events && response.events.length > 0) {
        setEvents(response.events);
        setStatusMessage("Stopped - " + response.events.length + " events captured");
      } else {
        setStatusMessage("Stopped - No events captured");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to stop recording";
      setStatusMessage("Error: " + errorMessage);
      setIsRecording(false);
      console.error("Failed to stop recording:", error);
    }
  };

  const handleSaveMacro = async () => {
    if (!macroName.trim() || events.length === 0) {
      setStatusMessage("Error: Name required and events must be captured");
      return;
    }
    try {
      setIsSaving(true);
      setStatusMessage("Saving...");
      const response = await api.saveMacro(macroName.trim(), events);
      setStatusMessage("Saved: " + response.name + " (" + events.length + " events)");
      setMacroName("");
      setEvents([]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save macro";
      setStatusMessage("Error: " + errorMessage);
      console.error("Failed to save macro:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CollapsibleCard title="Key Logger">
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleStartRecording} disabled={isRecording || isSaving}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Record</button>
          <button onClick={handleStopRecording} disabled={!isRecording || isSaving}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Stop</button>
          <button onClick={handleSaveMacro} disabled={!macroName.trim() || events.length === 0 || isRecording || isSaving}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
        </div>
        <input type="text" value={macroName} onChange={(e) => setMacroName(e.target.value)} placeholder="Macro name..." disabled={isRecording || isSaving}
          className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed" />
        <p className="text-xs text-muted-foreground">{statusMessage}</p>
        <LogDisplay logs={eventLogs} title="Captured Events" showFilter={true} showAutoScroll={true} onClear={events.length > 0 ? clearEvents : undefined} height="h-32" />
      </div>
    </CollapsibleCard>
  );
}
