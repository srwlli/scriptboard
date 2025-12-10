"use client";

import { useState, useEffect } from "react";
import { Folder, Star, Plus, Search, Clock, X } from "lucide-react";

interface Favorite {
  label: string;
  path: string;
}

interface RecentFolder {
  path: string;
  lastAccessed: Date;
}

/**
 * MOCKUP: Single icon button that opens a modal with favorites and recent files.
 * 
 * Features:
 * - Single folder icon button
 * - Modal dialog with:
 *   - Search input at top
 *   - Recent folders section (table)
 *   - Favorites section (table)
 *   - Add favorite button
 * - Click outside to close
 * - Escape key to close
 * - Prevents body scroll when open
 */
export function FavoritesDropdownMockup() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"favorites" | "recents">("favorites");

  // Mock data
  const mockFavorites: Favorite[] = [
    { label: "Project Alpha", path: "C:\\Projects\\Alpha" },
    { label: "Project Beta", path: "C:\\Projects\\Beta" },
    { label: "Documents", path: "C:\\Users\\willh\\Documents" },
  ];

  const mockRecent: RecentFolder[] = [
    { path: "C:\\Projects\\Alpha\\src", lastAccessed: new Date(Date.now() - 1000 * 60 * 5) },
    { path: "C:\\Projects\\Beta\\docs", lastAccessed: new Date(Date.now() - 1000 * 60 * 30) },
    { path: "C:\\Temp\\files", lastAccessed: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  ];

  // Filter based on search
  const filteredFavorites = mockFavorites.filter(
    (fav) =>
      fav.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecent = mockRecent.filter((recent) =>
    recent.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
        setActiveTab("favorites");
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOpenFolder = (path: string) => {
    console.log("Open folder:", path);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleAddFavorite = () => {
    console.log("Add favorite");
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleTabChange = (tab: "favorites" | "recents") => {
    setActiveTab(tab);
    setSearchQuery(""); // Clear search when switching tabs
  };

  return (
    <>
      {/* Single Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-md hover:bg-accent transition-colors flex items-center justify-center"
        title="Open favorites and recent folders"
        aria-label="Open favorites and recent folders"
      >
        <Folder size={18} className="text-foreground" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setIsOpen(false);
            setSearchQuery("");
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Favorites and recent folders"
        >
          <div
            className="bg-background border border-border rounded-md shadow-xl w-full max-w-2xl h-[85vh] max-h-[85vh] flex flex-col mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Tabs, Search, Close */}
            <div className="px-6 py-3 border-b border-border flex items-center gap-3">
              {/* Tabs */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTabChange("favorites")}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "favorites"
                      ? "text-foreground border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                  aria-selected={activeTab === "favorites"}
                  role="tab"
                >
                  <div className="flex items-center gap-1.5">
                    <Star size={14} />
                    <span>Fav</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange("recents")}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === "recents"
                      ? "text-foreground border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                  aria-selected={activeTab === "recents"}
                  role="tab"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>Recent</span>
                  </div>
                </button>
              </div>

              {/* Search Input */}
              <div className="flex-1 relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === "favorites"
                      ? "Search favorites..."
                      : "Search recent folders..."
                  }
                  className="w-full pl-8 pr-7 py-1.5 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded"
                    aria-label="Clear search"
                  >
                    <X size={12} className="text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery("");
                  setActiveTab("favorites");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent flex-shrink-0"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              {/* Favorites Tab Content */}
              {activeTab === "favorites" && (
                <div>
                  {filteredFavorites.length > 0 ? (
                    <div className="space-y-1">
                      {filteredFavorites.map((fav, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOpenFolder(fav.path)}
                          className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent transition-colors flex items-center justify-between group"
                          role="menuitem"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {fav.label}
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {fav.path}
                            </div>
                          </div>
                          <Folder
                            size={16}
                            className="ml-2 text-muted-foreground group-hover:text-foreground flex-shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-3 text-center">
                      {searchQuery ? "No favorites match your search" : "No favorites yet"}
                    </div>
                  )}
                </div>
              )}

              {/* Recents Tab Content */}
              {activeTab === "recents" && (
                <div>
                  {filteredRecent.length > 0 ? (
                    <div className="space-y-1">
                      {filteredRecent.map((recent, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOpenFolder(recent.path)}
                          className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent transition-colors flex items-center justify-between group"
                          role="menuitem"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate">
                              {recent.path}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {formatTimeAgo(recent.lastAccessed)}
                            </div>
                          </div>
                          <Folder
                            size={16}
                            className="ml-2 text-muted-foreground group-hover:text-foreground flex-shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-3 text-center">
                      {searchQuery ? "No recent folders match your search" : "No recent folders"}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Add Favorite Button (only show in Favorites tab) */}
            {activeTab === "favorites" && (
              <div className="px-6 py-4 border-t border-border">
                <button
                  onClick={handleAddFavorite}
                  className="w-full px-4 py-2.5 rounded-md bg-secondary text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  role="menuitem"
                >
                  <Plus size={16} />
                  <span>Add Favorite Folder</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

