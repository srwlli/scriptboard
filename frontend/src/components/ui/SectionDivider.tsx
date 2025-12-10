"use client";

/**
 * Reusable section divider component matching original scriptboard.py layout.
 * 
 * Creates a horizontal divider line between sections with consistent spacing.
 * 
 * @example
 * ```tsx
 * <SectionDivider />
 * ```
 */

interface SectionDividerProps {
  className?: string;
}

export function SectionDivider({ className = "" }: SectionDividerProps) {
  return (
    <div
      className={`h-px bg-[#21262d] my-2 mx-5 ${className}`}
      role="separator"
      aria-orientation="horizontal"
    />
  );
}

