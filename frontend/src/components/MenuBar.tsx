"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Home, Layout, Settings } from "lucide-react";
import { MenuDropdown } from "./ui/MenuDropdown";
import { WindowControls } from "./ui/WindowControls";

/**
 * Custom menu bar component for frameless window.
 *
 * Features:
 * - Navigation dropdown (Home, View Components, Settings)
 * - File menu with Exit option
 * - Help menu with Shortcuts, About
 * - Window controls (minimize, maximize, close) on right
 * - Draggable region for window movement
 * - Browser-compatible (window controls hidden in browser)
 */
export function MenuBar() {
  const [isElectron, setIsElectron] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  // Close nav dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setNavOpen(false);
      }
    };

    if (navOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && navOpen) {
        setNavOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [navOpen]);

  // File menu actions
  const handleExit = async () => {
    if (isElectron) {
      try {
        await (window as any).electronAPI.closeWindow();
      } catch (error) {
        console.error("Failed to close window:", error);
      }
    } else {
      alert("Exit is only available in the desktop app.");
    }
  };

  // Help menu actions
  const handleKeyboardShortcuts = () => {
    alert(
      "Keyboard Shortcuts:\n\n" +
        "Ctrl+V - Paste from clipboard\n" +
        "Ctrl+Shift+V - Paste and process\n" +
        "Ctrl+C - Copy to clipboard\n" +
        "Escape - Close modals\n" +
        "\nMore shortcuts coming soon!"
    );
  };

  const handleAbout = () => {
    alert(
      "Scriptboard\n\n" +
        "Version: 0.1.0\n" +
        "A clipboard companion for LLM workflows.\n\n" +
        "Built with Next.js, FastAPI, and Electron."
    );
  };

  // Navigation items
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/view-components", label: "View Components", icon: Layout },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const handleNavClick = (href: string) => {
    router.push(href);
    setNavOpen(false);
  };

  // Menu definitions
  const fileMenuItems = [
    {
      label: "Exit",
      onClick: handleExit,
      danger: true,
    },
  ];

  const helpMenuItems = [
    {
      label: "Shortcuts",
      onClick: handleKeyboardShortcuts,
    },
    {
      label: "About",
      onClick: handleAbout,
    },
  ];

  return (
    <div
      className="h-8 bg-background border-b border-border flex items-center justify-between select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Left side - Navigation + Menus */}
      <div
        className="flex items-center h-full"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {/* Navigation dropdown */}
        <div ref={navRef} className="relative">
          <button
            onClick={() => setNavOpen(!navOpen)}
            className={`h-8 px-3 hover:bg-accent transition-colors flex items-center ${
              navOpen ? "bg-accent" : ""
            }`}
            aria-label="Open navigation menu"
            aria-expanded={navOpen}
          >
            <Menu size={16} className="text-foreground" />
          </button>

          {navOpen && (
            <div
              className="absolute left-0 top-full mt-1 min-w-[180px] bg-background border border-border rounded-md shadow-lg py-1 z-50"
              role="menu"
              aria-label="Navigation menu"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                      isActive
                        ? "bg-accent text-foreground font-medium"
                        : "text-foreground hover:bg-accent"
                    }`}
                    role="menuitem"
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <span className="text-border select-none">|</span>
        <MenuDropdown label="File" items={fileMenuItems} />
        <MenuDropdown label="Help" items={helpMenuItems} />
      </div>

      {/* Spacer - draggable area */}
      <div className="flex-1" />

      {/* Right side - Window controls */}
      <WindowControls />
    </div>
  );
}
