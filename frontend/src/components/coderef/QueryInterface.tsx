"use client";

import { useState } from "react";
import { Search, ArrowRight, FileCode } from "lucide-react";

export interface QueryResult {
  type?: string;
  name?: string;
  file?: string;
  line?: number;
  relationship?: string;
  raw?: string;
}

export interface QueryResultsData {
  success: boolean;
  target: string;
  results: QueryResult[];
}

interface QueryInterfaceProps {
  onQuery: (target: string) => Promise<void>;
  results: QueryResultsData | null;
  loading?: boolean;
}

export function QueryInterface({ onQuery, results, loading }: QueryInterfaceProps) {
  const [target, setTarget] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (target.trim()) {
      await onQuery(target.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* Query Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Enter element name (e.g., handleClick, UserService)"
            className="w-full pl-10 pr-3 py-2 bg-muted border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !target.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <>
              Query
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Results */}
      {results && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Results for: <span className="font-mono text-foreground">{results.target}</span>
          </div>

          {results.results.length === 0 ? (
            <div className="text-center text-muted-foreground py-4 text-sm">
              No dependencies found
            </div>
          ) : (
            <div className="max-h-[300px] overflow-auto space-y-1">
              {results.results.map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded text-xs"
                >
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                  {result.raw ? (
                    <pre className="flex-1 overflow-x-auto text-xs">{result.raw}</pre>
                  ) : (
                    <>
                      <span className="font-mono font-medium">{result.name}</span>
                      {result.relationship && (
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px]">
                          {result.relationship}
                        </span>
                      )}
                      {result.file && (
                        <span className="ml-auto text-muted-foreground truncate max-w-[200px]">
                          {result.file.split("/").pop()}
                          {result.line && `:${result.line}`}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
