"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Response {
  id: string;
  source: string;
  content: string;
  char_count: number;
}

interface ResponseDiffViewerProps {
  response1Id: string | null;
  response2Id: string | null;
  onClose: () => void;
}

export function ResponseDiffViewer({
  response1Id,
  response2Id,
  onClose,
}: ResponseDiffViewerProps) {
  const [response1, setResponse1] = useState<Response | null>(null);
  const [response2, setResponse2] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [diffMode, setDiffMode] = useState<"side-by-side" | "unified">("side-by-side");

  useEffect(() => {
    loadResponses();
  }, [response1Id, response2Id]);

  const loadResponses = async () => {
    if (!response1Id || !response2Id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.getResponses();
      const responses = data.responses as Response[];

      const resp1 = responses.find((r) => r.id === response1Id);
      const resp2 = responses.find((r) => r.id === response2Id);

      setResponse1(resp1 || null);
      setResponse2(resp2 || null);
    } catch (error) {
      console.error("Failed to load responses:", error);
    } finally {
      setLoading(false);
    }
  };

  const computeDiff = (text1: string, text2: string): Array<{
    type: "equal" | "insert" | "delete";
    text: string;
  }> => {
    // Simple line-based diff algorithm
    const lines1 = text1.split("\n");
    const lines2 = text2.split("\n");
    const diff: Array<{ type: "equal" | "insert" | "delete"; text: string }> = [];

    let i = 0;
    let j = 0;

    while (i < lines1.length || j < lines2.length) {
      if (i >= lines1.length) {
        // Only lines2 remaining
        diff.push({ type: "insert", text: lines2[j] });
        j++;
      } else if (j >= lines2.length) {
        // Only lines1 remaining
        diff.push({ type: "delete", text: lines1[i] });
        i++;
      } else if (lines1[i] === lines2[j]) {
        // Lines match
        diff.push({ type: "equal", text: lines1[i] });
        i++;
        j++;
      } else {
        // Lines differ - check if next line matches
        if (i + 1 < lines1.length && lines1[i + 1] === lines2[j]) {
          diff.push({ type: "delete", text: lines1[i] });
          i++;
        } else if (j + 1 < lines2.length && lines1[i] === lines2[j + 1]) {
          diff.push({ type: "insert", text: lines2[j] });
          j++;
        } else {
          diff.push({ type: "delete", text: lines1[i] });
          diff.push({ type: "insert", text: lines2[j] });
          i++;
          j++;
        }
      }
    }

    return diff;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background p-6 rounded-lg border border-border">
          <p className="text-foreground">Loading responses...</p>
        </div>
      </div>
    );
  }

  if (!response1 || !response2) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background p-6 rounded-lg border border-border max-w-md">
          <p className="text-foreground mb-4">Could not load responses for comparison</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-border bg-background hover:bg-accent transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const diff = diffMode === "unified" ? computeDiff(response1.content, response2.content) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Compare Responses</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDiffMode(diffMode === "side-by-side" ? "unified" : "side-by-side")}
              className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
            >
              {diffMode === "side-by-side" ? "Unified View" : "Side-by-Side"}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {diffMode === "side-by-side" ? (
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Response 1 */}
              <div className="flex flex-col">
                <div className="mb-2 p-2 bg-muted rounded">
                  <p className="text-sm font-medium text-foreground">
                    {response1.source || "Response 1"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {response1.char_count.toLocaleString()} characters
                  </p>
                </div>
                <div className="flex-1 border border-border rounded p-3 overflow-auto bg-muted/30">
                  <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-mono">
                    {response1.content}
                  </pre>
                </div>
              </div>

              {/* Response 2 */}
              <div className="flex flex-col">
                <div className="mb-2 p-2 bg-muted rounded">
                  <p className="text-sm font-medium text-foreground">
                    {response2.source || "Response 2"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {response2.char_count.toLocaleString()} characters
                  </p>
                </div>
                <div className="flex-1 border border-border rounded p-3 overflow-auto bg-muted/30">
                  <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-mono">
                    {response2.content}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2 bg-muted rounded flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Comparing: {response1.source || "Response 1"} vs {response2.source || "Response 2"}
                  </p>
                </div>
              </div>
              <div className="border border-border rounded p-3 overflow-auto bg-muted/30 max-h-[60vh]">
                <pre className="text-xs font-mono">
                  {diff?.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.type === "delete"
                          ? "bg-red-500/20 text-red-300"
                          : line.type === "insert"
                          ? "bg-green-500/20 text-green-300"
                          : "text-foreground"
                      }
                    >
                      {line.type === "delete" && "- "}
                      {line.type === "insert" && "+ "}
                      {line.type === "equal" && "  "}
                      {line.text}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

