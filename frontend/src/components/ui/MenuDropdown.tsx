"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface MenuItemProps {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
}

interface MenuDropdownProps {
  label: string;
  items: MenuItemProps[];
  className?: string;
}

/**
 * Reusable dropdown menu component for menu bar items.
 *
 * Features:
 * - Opens on click, closes on outside click or Escape
 * - Keyboard navigation (arrow keys, Enter to select)
 * - Optional icons and keyboard shortcuts
 * - Danger state for destructive actions
 */
export function MenuDropdown({ label, items, className = "" }: MenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % items.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (focusedIndex >= 0 && !items[focusedIndex].disabled) {
          items[focusedIndex].onClick();
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;
    }
  };

  const handleItemClick = (item: MenuItemProps) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`px-2 py-1 text-sm font-medium transition-colors rounded hover:bg-accent ${
          isOpen ? "bg-accent" : ""
        }`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {label}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1 min-w-[160px] bg-background border border-border rounded-md shadow-lg py-1 z-50"
          role="menu"
          aria-label={`${label} menu`}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between gap-4 transition-colors ${
                item.disabled
                  ? "text-muted-foreground cursor-not-allowed"
                  : item.danger
                    ? "text-destructive hover:bg-destructive/10"
                    : focusedIndex === index
                      ? "bg-accent text-foreground"
                      : "text-foreground hover:bg-accent"
              }`}
              role="menuitem"
              tabIndex={-1}
            >
              <span className="flex items-center gap-2">
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                {item.label}
              </span>
              {item.shortcut && (
                <span className="text-xs text-muted-foreground">{item.shortcut}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
