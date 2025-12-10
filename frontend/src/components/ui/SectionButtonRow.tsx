"use client";

/**
 * Reusable button row component matching original scriptboard.py layout.
 * 
 * Buttons are displayed in a centered horizontal row with:
 * - Primary button (leftmost): Green background, white text
 * - Secondary buttons (right): Gray background, muted text
 * - Fixed width buttons (matching original 8-character width)
 * - Consistent spacing between buttons
 * 
 * @example
 * ```tsx
 * <SectionButtonRow
 *   buttons={[
 *     { text: "Load", onClick: handleLoad, variant: "primary" },
 *     { text: "Paste", onClick: handlePaste, variant: "secondary" },
 *     { text: "View", onClick: handleView, variant: "secondary" },
 *     { text: "Clear", onClick: handleClear, variant: "secondary" },
 *   ]}
 * />
 * ```
 */

export interface ButtonConfig {
  text: string;
  onClick: () => void;
  variant: "primary" | "secondary";
  disabled?: boolean;
}

interface SectionButtonRowProps {
  buttons: ButtonConfig[];
  className?: string;
}

export function SectionButtonRow({ buttons, className = "" }: SectionButtonRowProps) {
  return (
    <div className={`flex justify-center gap-1 ${className}`}>
      {buttons.map((button, index) => {
        const isPrimary = button.variant === "primary";
        const baseClasses = "px-3 py-1.5 text-sm rounded-md font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
        
        const variantClasses = isPrimary
          ? "bg-[#1a7f37] text-white hover:bg-[#238636] active:bg-[#238636]"
          : "bg-[#161b22] text-[#c9d1d9] hover:bg-[#21262d] active:bg-[#21262d] border border-[#21262d]";
        
        // Fixed width matching original (8 characters ≈ 64px)
        const widthClass = "w-16";
        
        return (
          <button
            key={index}
            onClick={button.onClick}
            disabled={button.disabled}
            className={`${baseClasses} ${variantClasses} ${widthClass}`}
          >
            {button.text}
          </button>
        );
      })}
    </div>
  );
}

