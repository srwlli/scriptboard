"use client";

/**
 * Reusable status label component matching original scriptboard.py layout.
 * 
 * Displays status text in a panel-style container with:
 * - Muted text color
 * - Panel background
 * - Left-aligned text
 * - Consistent padding
 * 
 * @example
 * ```tsx
 * <StatusLabel text="No prompt" />
 * <StatusLabel text="Responses: 5 | Characters: 1,234" />
 * ```
 */

interface StatusLabelProps {
  text: string;
  className?: string;
}

export function StatusLabel({ text, className = "" }: StatusLabelProps) {
  return (
    <div
      className={`px-2.5 py-1.5 bg-[#0d1117] text-[#6e7681] text-sm w-full ${className}`}
    >
      {text}
    </div>
  );
}

