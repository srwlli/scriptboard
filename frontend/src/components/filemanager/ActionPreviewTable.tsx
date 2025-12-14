"use client";

import { FileAction } from "@/lib/api";
import { ArrowRight, Trash2, Edit3, FolderInput, Copy } from "lucide-react";

interface ActionPreviewTableProps {
  actions: FileAction[];
  maxHeight?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getOpIcon(op: string) {
  switch (op) {
    case "move":
      return <FolderInput size={12} className="text-blue-500" />;
    case "rename":
      return <Edit3 size={12} className="text-yellow-500" />;
    case "delete":
    case "trash":
      return <Trash2 size={12} className="text-red-500" />;
    case "dupe":
      return <Copy size={12} className="text-purple-500" />;
    default:
      return <ArrowRight size={12} className="text-muted-foreground" />;
  }
}

function getOpLabel(op: string): string {
  const labels: Record<string, string> = {
    move: "Move",
    rename: "Rename",
    delete: "Delete",
    trash: "Trash",
    dupe: "Duplicate",
    rmdir: "Remove Dir",
    mkdir: "Create Dir",
    undo_failed: "Undo Failed",
  };
  return labels[op] || op;
}

function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

export function ActionPreviewTable({ actions, maxHeight = "300px" }: ActionPreviewTableProps) {
  if (actions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded">
        No actions to preview
      </div>
    );
  }

  return (
    <div className="border border-border rounded overflow-hidden">
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted border-b border-border">
            <tr>
              <th className="text-left p-2 w-20">Action</th>
              <th className="text-left p-2">Source</th>
              <th className="text-left p-2">Destination</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action, idx) => (
              <tr
                key={idx}
                className="border-b border-border/50 hover:bg-muted/50"
              >
                <td className="p-2">
                  <div className="flex items-center gap-1.5">
                    {getOpIcon(action.op)}
                    <span className="capitalize">{getOpLabel(action.op)}</span>
                  </div>
                </td>
                <td className="p-2">
                  <span
                    className="truncate block max-w-[200px]"
                    title={action.src}
                  >
                    {getFileName(action.src)}
                  </span>
                </td>
                <td className="p-2">
                  {action.dst ? (
                    <span
                      className="truncate block max-w-[200px] text-muted-foreground"
                      title={action.dst}
                    >
                      {getFileName(action.dst)}
                    </span>
                  ) : action.op === "trash" ? (
                    <span className="text-muted-foreground italic">Recycle Bin</span>
                  ) : action.op === "delete" ? (
                    <span className="text-red-500 italic">Permanent</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-muted px-2 py-1.5 text-xs text-muted-foreground border-t border-border">
        {actions.length} action{actions.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
