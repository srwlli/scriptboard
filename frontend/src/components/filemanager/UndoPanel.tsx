"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ActionHistoryBatch, FileAction } from "@/lib/api";
import { useConfirmModal } from "@/components/ui/ConfirmModal";
import { ActionPreviewTable } from "./ActionPreviewTable";
import { Undo2, RefreshCw, Trash2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

export function UndoPanel() {
  const [batches, setBatches] = useState<ActionHistoryBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<number | null>(null);
  const [undoPreview, setUndoPreview] = useState<{ batchIndex: number; actions: FileAction[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [ConfirmModalComponent, confirm] = useConfirmModal();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.filemanGetHistory();
      setBatches(result.batches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePreviewUndo = async (batchIndex: number) => {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await api.filemanUndo(batchIndex, false);
      setUndoPreview({ batchIndex, actions: result.actions });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview undo");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyUndo = async () => {
    if (!undoPreview) return;

    const confirmed = await confirm({
      title: "Undo Operations?",
      message: `This will reverse ${undoPreview.actions.length} operation${undoPreview.actions.length !== 1 ? "s" : ""}. Continue?`,
      confirmText: "Undo",
      cancelText: "Cancel",
      danger: false,
    });

    if (!confirmed) return;

    setIsProcessing(true);
    setError(null);

    try {
      await api.filemanUndo(undoPreview.batchIndex, true);
      setSuccessMessage(`Successfully reversed ${undoPreview.actions.length} operations`);
      setUndoPreview(null);
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply undo");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearHistory = async () => {
    const confirmed = await confirm({
      title: "Clear History?",
      message: "This will clear all undo history. You will not be able to undo previous operations. Continue?",
      confirmText: "Clear",
      cancelText: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    setIsProcessing(true);
    setError(null);

    try {
      await api.filemanClearHistory();
      setBatches([]);
      setUndoPreview(null);
      setSuccessMessage("History cleared");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear history");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedBatch(expandedBatch === index ? null : index);
  };

  const getOpSummary = (actions: FileAction[]): string => {
    const ops: Record<string, number> = {};
    actions.forEach((a) => {
      ops[a.op] = (ops[a.op] || 0) + 1;
    });
    return Object.entries(ops)
      .map(([op, count]) => `${count} ${op}`)
      .join(", ");
  };

  return (
    <div className="space-y-4">
      {ConfirmModalComponent}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Operation History</h3>
        <div className="flex gap-2">
          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleClearHistory}
            disabled={batches.length === 0 || isProcessing}
            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
            title="Clear History"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}

      {/* History List */}
      {batches.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Undo2 size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No operations to undo</p>
          <p className="text-xs mt-1">Operations will appear here after you apply changes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {batches.map((batch, idx) => (
            <div key={batch.index} className="border border-border rounded overflow-hidden">
              {/* Batch Header */}
              <div
                className="flex items-center justify-between px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(idx)}
              >
                <div className="flex items-center gap-2">
                  {expandedBatch === idx ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  <span className="text-sm font-medium">
                    Batch #{batch.index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({batch.count} operation{batch.count !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {getOpSummary(batch.actions)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewUndo(batch.index);
                    }}
                    disabled={isProcessing}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    <Undo2 size={12} />
                    Undo
                  </button>
                </div>
              </div>

              {/* Expanded Actions */}
              {expandedBatch === idx && (
                <div className="border-t border-border">
                  <ActionPreviewTable actions={batch.actions} maxHeight="200px" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Undo Preview */}
      {undoPreview && (
        <div className="border border-primary/50 rounded-md p-3 bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Undo Preview</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setUndoPreview(null)}
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyUndo}
                disabled={isProcessing}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />}
                Apply Undo
              </button>
            </div>
          </div>
          <ActionPreviewTable actions={undoPreview.actions} maxHeight="200px" />
        </div>
      )}
    </div>
  );
}
