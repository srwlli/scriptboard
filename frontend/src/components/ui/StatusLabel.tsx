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
    // Wrapper to center the status label (matches SectionButtonRow centering)
    <div className="flex justify-center">
      <div
        // Fixed width matching button row: 4 buttons × 64px + 3 gaps × 4px = 268px
        className={`px-2.5 py-1.5 bg-secondary text-muted-foreground text-sm w-[268px] text-center ${className}`}
      >
        {text}
      </div>
    </div>
  );
}

