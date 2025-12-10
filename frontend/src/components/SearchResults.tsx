"use client";

interface SearchResult {
  id: string;
  type: "prompt" | "attachment" | "response";
  snippet: string;
  filename?: string;
  source?: string;
}

interface SearchResultsProps {
  results: {
    results: SearchResult[];
    total: number;
    limit: number;
    offset: number;
  };
  query: string;
  onClose: () => void;
}

export function SearchResults({ results, query, onClose }: SearchResultsProps) {
  const grouped = results.results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels: Record<string, string> = {
    prompt: "Prompts",
    attachment: "Attachments",
    response: "Responses",
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {results.total} result{results.total !== 1 ? "s" : ""} for "{query}"
        </span>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="p-3 space-y-4">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
              {typeLabels[type] || type}
            </h3>
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="p-2 rounded hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="text-xs text-foreground">
                    {item.filename && (
                      <div className="font-medium mb-1">{item.filename}</div>
                    )}
                    {item.source && (
                      <div className="text-muted-foreground mb-1">
                        Source: {item.source}
                      </div>
                    )}
                    <div className="text-muted-foreground line-clamp-2">
                      {item.snippet}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {results.total > results.limit && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            Showing {results.results.length} of {results.total} results
          </div>
        )}
      </div>
    </div>
  );
}

