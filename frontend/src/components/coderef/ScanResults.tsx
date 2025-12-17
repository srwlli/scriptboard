"use client";

import { Code, FileCode, FunctionSquare, Box, Braces, Hash } from "lucide-react";

export interface ScanElement {
  type: string;
  name: string;
  file: string;
  line: number;
  exported?: boolean;
}

export interface ScanResultsData {
  success: boolean;
  elements: ScanElement[];
  element_count: number;
  by_type: Record<string, number>;
  source_dir: string;
}

interface ScanResultsProps {
  data: ScanResultsData | null;
  loading?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  function: <FunctionSquare className="w-3.5 h-3.5 text-blue-400" />,
  component: <Box className="w-3.5 h-3.5 text-purple-400" />,
  class: <Braces className="w-3.5 h-3.5 text-amber-400" />,
  interface: <Code className="w-3.5 h-3.5 text-green-400" />,
  type: <Hash className="w-3.5 h-3.5 text-cyan-400" />,
  default: <FileCode className="w-3.5 h-3.5 text-muted-foreground" />,
};

const typeColors: Record<string, string> = {
  function: "bg-blue-500/20 text-blue-400",
  component: "bg-purple-500/20 text-purple-400",
  class: "bg-amber-500/20 text-amber-400",
  interface: "bg-green-500/20 text-green-400",
  type: "bg-cyan-500/20 text-cyan-400",
};

export function ScanResults({ data, loading }: ScanResultsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Run a scan to see results
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Object.entries(data.by_type).map(([type, count]) => (
          <div
            key={type}
            className={`flex items-center gap-2 px-3 py-2 rounded border border-border ${typeColors[type] || "bg-muted text-muted-foreground"}`}
          >
            {typeIcons[type] || typeIcons.default}
            <span className="text-xs font-medium capitalize">{type}</span>
            <span className="ml-auto text-sm font-bold">{count}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted rounded">
        <span className="text-sm font-medium">Total Elements</span>
        <span className="text-lg font-bold">{data.element_count}</span>
      </div>

      {/* Element List */}
      <div className="max-h-[400px] overflow-auto space-y-1">
        {data.elements.slice(0, 100).map((elem, idx) => (
          <div
            key={`${elem.file}-${elem.line}-${idx}`}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded text-xs"
          >
            {typeIcons[elem.type] || typeIcons.default}
            <span className="font-mono font-medium truncate max-w-[150px]">
              {elem.name}
            </span>
            {elem.exported && (
              <span className="px-1 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">
                exported
              </span>
            )}
            <span className="ml-auto text-muted-foreground truncate max-w-[200px]">
              {elem.file.split("/").pop()}:{elem.line}
            </span>
          </div>
        ))}
        {data.elements.length > 100 && (
          <div className="text-center text-muted-foreground text-xs py-2">
            Showing 100 of {data.elements.length} elements
          </div>
        )}
      </div>
    </div>
  );
}
