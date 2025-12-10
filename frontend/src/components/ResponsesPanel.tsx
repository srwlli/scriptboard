"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ResponseDiffViewer } from "./ResponseDiffViewer";

interface Response {
  id: string;
  source: string;
  char_count: number;
}

export function ResponsesPanel() {
  const [responseCount, setResponseCount] = useState(0);
  const [llmUrls, setLlmUrls] = useState<Array<{ label: string; url: string }>>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [selectedResponse1, setSelectedResponse1] = useState<string | null>(null);
  const [selectedResponse2, setSelectedResponse2] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summary, config, responsesData] = await Promise.all([
        api.getResponsesSummary(),
        api.getConfig(),
        api.getResponses().catch(() => ({ responses: [] })), // Fallback if endpoint not available
      ]);
      setResponseCount(summary.count || 0);
      setLlmUrls((config.llm_urls || []) as Array<{ label: string; url: string }>);
      setResponses((responsesData.responses || []) as Response[]);
    } catch (error) {
      // Silently fail if backend is not available
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load data:", error);
      }
    }
  };

  const handleOpenLLM = (url: string) => {
    window.open(url, "_blank");
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      await api.addResponse(text);
      await loadData();
    } catch (error) {
      console.error("Failed to paste response:", error);
    }
  };

  const handleView = async () => {
    // Show diff viewer if we have at least 2 responses
    if (responses.length >= 2) {
      setSelectedResponse1(responses[0].id);
      setSelectedResponse2(responses[1].id);
      setShowDiffViewer(true);
    } else if (responses.length === 1) {
      // If only one response, show it in a simple view
      alert(`Response from ${responses[0].source}: ${responses[0].char_count} characters`);
    } else {
      alert("No responses to view");
    }
  };

  const handleCompare = (response1Id: string, response2Id: string) => {
    setSelectedResponse1(response1Id);
    setSelectedResponse2(response2Id);
    setShowDiffViewer(true);
  };

  const handleClear = async () => {
    try {
      await api.clearResponses();
      setResponseCount(0);
    } catch (error) {
      console.error("Failed to clear responses:", error);
    }
  };

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <h2 className="text-sm font-semibold mb-3 text-foreground">Responses</h2>

      <div className="space-y-2 mb-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handlePaste}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            Paste
          </button>
          <button
            onClick={handleView}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            View
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {responseCount} response{responseCount !== 1 ? "s" : ""}
        </p>
      </div>

      {responses.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-foreground mb-2">Responses:</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {responses.map((resp, idx) => (
              <div
                key={resp.id}
                className="px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground">
                    {resp.source || `Response ${idx + 1}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {resp.char_count.toLocaleString()} chars
                  </span>
                </div>
                {responses.length > 1 && idx < responses.length - 1 && (
                  <button
                    onClick={() => handleCompare(resp.id, responses[idx + 1].id)}
                    className="mt-1 text-xs text-primary hover:underline"
                  >
                    Compare with next
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {llmUrls.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-foreground mb-1">Open LLMs:</p>
          <div className="flex flex-wrap gap-1">
            {llmUrls.map((llm, idx) => (
              <button
                key={idx}
                onClick={() => handleOpenLLM(llm.url)}
                className="px-2 py-1 text-xs rounded-md border border-border bg-background hover:bg-accent transition-colors"
              >
                {llm.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showDiffViewer && selectedResponse1 && selectedResponse2 && (
        <ResponseDiffViewer
          response1Id={selectedResponse1}
          response2Id={selectedResponse2}
          onClose={() => {
            setShowDiffViewer(false);
            setSelectedResponse1(null);
            setSelectedResponse2(null);
          }}
        />
      )}
    </div>
  );
}

