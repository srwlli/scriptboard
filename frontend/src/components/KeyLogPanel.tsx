"use client";

import { useState } from "react";
import { api } from "@/lib/api";

/**
 * Key Log Panel component for recording keyboard and clipboard events as macros.
 *
 * Features:
 * - Record button to start recording
 * - Stop button to stop recording
 * - Save button to save captured events as a macro
 * - Name input field for macro name
 * - Status display (Idle/Recording)
 * - Save button disabled until name provided
 */
export function KeyLogPanel() {
  const [isRecording, setIsRecording] = useState(false);
  const [events, setEvents] = useState<
    Array<{
      type: string;
      ts_delta_ms: number;
      key?: string;
      clipboard_text?: string;
      delay_ms?: number;
      window_title?: string;
    }>
  >([]);
  const [macroName, setMacroName] = useState("");
  const [statusMessage, setStatusMessage] = useState("Idle");
  const [isSaving, setIsSaving] = useState(false);

  const handleStartRecording = async () => {
    try {
      setStatusMessage("Starting...");
      await api.startRecording();
      setIsRecording(true);
      setEvents([]);
      setMacroName("");
      setStatusMessage("Recording...");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start recording";
      setStatusMessage(`Error: ${errorMessage}`);
      setIsRecording(false);
      console.error("Failed to start recording:", error);
    }
  };

  const handleStopRecording = async () => {
    try {
      setStatusMessage("Stopping...");
      const response = await api.stopRecording();
      setIsRecording(false);

      if (response.events && response.events.length > 0) {
        setEvents(response.events);
        setStatusMessage(`Stopped - ${response.events.length} events captured`);
      } else {
        setEvents([]);
        setStatusMessage("Stopped - No events captured");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to stop recording";
      setStatusMessage(`Error: ${errorMessage}`);
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
      setStatusMessage(`Saved: ${response.name} (${events.length} events)`);
      setMacroName("");
      setEvents([]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save macro";
      setStatusMessage(`Error: ${errorMessage}`);
      console.error("Failed to save macro:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <h2 className="text-sm font-semibold mb-3 text-foreground">Key Logger</h2>

      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleStartRecording}
            disabled={isRecording || isSaving}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Record
          </button>
          <button
            onClick={handleStopRecording}
            disabled={!isRecording || isSaving}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stop
          </button>
          <button
            onClick={handleSaveMacro}
            disabled={
              !macroName.trim() || events.length === 0 || isRecording || isSaving
            }
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>

        <input
          type="text"
          value={macroName}
          onChange={(e) => setMacroName(e.target.value)}
          placeholder="Macro name..."
          disabled={isRecording || isSaving}
          className="w-full px-2.5 py-1.5 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <p className="text-xs text-muted-foreground">{statusMessage}</p>
      </div>
    </div>
  );
}

