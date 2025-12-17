"use client";

import { useState } from "react";
import { ExternalLink, Download, X, Maximize2 } from "lucide-react";

export interface DashboardData {
  success: boolean;
  dashboard_path: string;
  dashboard_url: string;
}

interface DashboardViewerProps {
  data: DashboardData | null;
  baseUrl: string;
  onClose?: () => void;
}

export function DashboardViewer({ data, baseUrl, onClose }: DashboardViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Generate a dashboard to view it here
      </div>
    );
  }

  const dashboardUrl = `${baseUrl}${data.dashboard_url}`;

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-2 bg-muted hover:bg-muted/80 rounded"
            title="Exit fullscreen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <iframe
          src={dashboardUrl}
          className="w-full h-full border-none"
          title="CodeRef Dashboard"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Dashboard Preview</span>
        <div className="flex gap-1">
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 hover:bg-muted rounded"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 hover:bg-muted rounded"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href={dashboardUrl}
            download
            className="p-1.5 hover:bg-muted rounded"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Iframe Preview */}
      <div className="border border-border rounded overflow-hidden">
        <iframe
          src={dashboardUrl}
          className="w-full h-[400px] border-none bg-white"
          title="CodeRef Dashboard"
        />
      </div>
    </div>
  );
}
