"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useBackendConnection } from "@/hooks/useBackendConnection";

interface BatchJob {
  id: string;
  prompt: string;
  model: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled" | "done" | "error";
  error?: string;
}

export function BatchQueuePanel() {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEnqueue, setShowEnqueue] = useState(false);
  const [enqueuePrompt, setEnqueuePrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  const { isConnected } = useBackendConnection();
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // Load models on connect
  useEffect(() => {
    const fetchModels = async () => {
      try {
        // Fetch Models
        const providersData = await api.getLLMProviders() as any;
        if (providersData && providersData.providers) {
          const models = providersData.providers.flatMap((p: any) => p.models);
          setAvailableModels(models);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
        // Fallback for models
        if (availableModels.length === 0) {
          setAvailableModels([
            "gpt-4",
            "gpt-3.5-turbo",
            "claude-3-opus",
            "claude-3-sonnet",
            "claude-3-haiku",
          ]);
        }
      }
    };

    if (isConnected) {
      fetchModels();
    }
  }, [isConnected]);

  const loadJobs = async () => {
    if (!isConnected) return;
    try {
      const data = await api.getBatchJobs();
      setJobs((data.jobs || []) as BatchJob[]);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load batch jobs:", error);
      }
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadJobs();
      const interval = setInterval(loadJobs, 2000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const handleEnqueue = async () => {
    if (!enqueuePrompt.trim() || selectedModels.length === 0) {
      alert("Please provide a prompt and select at least one model");
      return;
    }

    setLoading(true);
    try {
      await api.enqueueBatch(enqueuePrompt, selectedModels);
      setEnqueuePrompt("");
      setSelectedModels([]);
      setShowEnqueue(false);
      await loadJobs();
    } catch (error) {
      console.error("Failed to enqueue batch:", error);
      alert("Failed to enqueue batch jobs");
    } finally {
      setLoading(false);
    }
  };



  const handleCancel = async (jobId: string) => {
    try {
      await api.cancelBatchJob(jobId);
      await loadJobs();
    } catch (error) {
      console.error("Failed to cancel job:", error);
      alert("Failed to cancel job");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "done":
        return "text-green-500";
      case "failed":
      case "error":
        return "text-red-500";
      case "running":
        return "text-blue-500";
      case "cancelled":
        return "text-gray-500";
      default:
        return "text-yellow-500";
    }
  };

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Batch Queue</h2>
        <button
          onClick={() => setShowEnqueue(!showEnqueue)}
          className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
        >
          {showEnqueue ? "Cancel" : "New Batch"}
        </button>
      </div>



      {showEnqueue && (
        <div className="mb-4 p-3 border border-border rounded-md bg-muted/30">
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Prompt
              </label>
              <textarea
                value={enqueuePrompt}
                onChange={(e) => setEnqueuePrompt(e.target.value)}
                placeholder="Enter prompt for batch processing..."
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">
                Models
              </label>
              <div className="flex flex-wrap gap-2">
                {availableModels.map((model) => (
                  <label
                    key={model}
                    className="flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModels([...selectedModels, model]);
                        } else {
                          setSelectedModels(
                            selectedModels.filter((m) => m !== model)
                          );
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-foreground">{model}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={handleEnqueue}
              disabled={loading}
              className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading ? "Enqueueing..." : "Enqueue Batch"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No batch jobs
          </p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="p-2 border border-border rounded-md bg-muted/30"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">{job.model}</span>
                </div>
                {job.status === "pending" || job.status === "running" ? (
                  <button
                    onClick={() => handleCancel(job.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-foreground line-clamp-2">
                {job.prompt.substring(0, 100)}
                {job.prompt.length > 100 ? "..." : ""}
              </p>
              {job.error && (
                <p className="text-xs text-red-500 mt-1">{job.error}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

