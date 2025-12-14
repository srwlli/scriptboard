"use client";

import { SystemMonitor } from "@/components/SystemMonitor";
import { FileManager } from "@/components/FileManager";

/**
 * Test page - displays System Monitor and File Manager components.
 */
export default function TestPage() {
  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Component Test Page</h1>
      <SystemMonitor />
      <FileManager />
    </div>
  );
}
