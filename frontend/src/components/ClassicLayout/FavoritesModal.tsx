"use client";

import { useState, useEffect, useRef } from "react";
import { Folder, Star, Plus, Search, Clock, X, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useRecentFolders } from "@/hooks/useRecentFolders";

interface Favorite {
  label: string;
  path: string;
}

interface RecentFolder {
  path: string;
  lastAccessed: Date;
}

/**
 * Favorites modal component with tabs for favorites and recent folders.
 *
 * Features:
 * - Single folder icon button in header
 * - Modal dialog with:
 *   - Tabs: Favorites | Recents
 *   - Search icon that expands to search input
 *   - Add favorite button in header (favorites tab only)
 * - Click outside to close
 * - Escape key to close
 * - Prevents body scroll when open
 */
export function FavoritesModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "recents">("favorites");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState("");
  const [newFavoriteLabel, setNewFavoriteLabel] = useState("");
  const { recentFolders, addRecentFolder } = useRecentFolders();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check for Electron API availability and load favorites
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setIsLoadingFavorites(true);
    try {
      const config = await api.getConfig();
      const favs = (config.favorites || []) as Favorite[];
      setFavorites(favs);
    } catch (error) {
      console.error("Failed to load favorites:", error);
      // Keep empty array on error
      setFavorites([]);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  // Filter based on search
  const filteredFavorites = favorites.filter(
    (fav) =>
      fav.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecent = recentFolders.filter((recent) =>
    recent.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close search on Escape, or close modal if search is not expanded
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isSearchExpanded) {
          // First close the search
          setIsSearchExpanded(false);
          setSearchQuery("");
        } else {
          // Then close the modal
          setIsOpen(false);
          setSearchQuery("");
          setActiveTab("favorites");
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isSearchExpanded]);

  // Auto-focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

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

  const handleOpenFolder = async (path: string) => {
    // Close modal immediately on click
    setIsOpen(false);
    setSearchQuery("");
    
    if (isElectron) {
      try {
        const result = await (window as any).electronAPI.openFolder(path);
        if (result && result.error) {
          console.error("Failed to open folder:", result.error);
          alert(`Failed to open folder: ${result.error}`);
          return;
        }
        // Success - track as recent folder
        addRecentFolder(path);
      } catch (error) {
        console.error("Failed to open folder:", error);
        alert("Failed to open folder in file explorer");
      }
    } else {
      // Fallback for web: show path info
      alert(`Folder: ${path}\n\nOpening folders requires the Electron desktop app.`);
    }
  };

  const handleRemoveFavorite = async (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const favorite = favorites[index];
    if (!favorite) return;
    
    if (!confirm(`Remove favorite "${favorite.label}"?`)) {
      return;
    }

    try {
      await api.removeFavorite(index);
      // Refresh favorites list
      await loadFavorites();
    } catch (error: any) {
      console.error("Failed to remove favorite:", error);
      alert(`Failed to remove favorite: ${error.message || String(error)}`);
    }
  };

  const handleAddFavorite = async () => {
    if (!isElectron) {
      alert("Adding favorites requires Electron. Please use the desktop app.");
      return;
    }

    try {
      setIsAddingFavorite(true);
      
      // Open folder picker
      const result = await (window as any).electronAPI.selectFolder();
      if (!result || !result.path || result.error) {
        if (result?.error) {
          alert(`Failed to select folder: ${result.error}`);
        }
        setIsAddingFavorite(false);
        return;
      }

      const selectedPath = result.path;
      
      // Get folder name as default label
      const defaultLabel = selectedPath.split(/[/\\]/).filter(Boolean).pop() || "Favorite";
      
      // Show label input modal
      setSelectedFolderPath(selectedPath);
      setNewFavoriteLabel(defaultLabel);
      setShowLabelModal(true);
      setIsAddingFavorite(false);
    } catch (error: any) {
      console.error("Failed to select folder:", error);
      alert(`Failed to open folder picker: ${error.message || String(error)}`);
      setIsAddingFavorite(false);
    }
  };

  const handleSaveFavoriteLabel = async () => {
    if (!newFavoriteLabel.trim()) {
      alert("Please enter a label for the favorite.");
      return;
    }

    try {
      setIsAddingFavorite(true);
      
      // Add favorite via API
      await api.addFavorite(newFavoriteLabel.trim(), selectedFolderPath);
      
      // Refresh favorites list
      await loadFavorites();
      
      // Close modals
      setShowLabelModal(false);
      setSelectedFolderPath("");
      setNewFavoriteLabel("");
      setIsOpen(false);
      setSearchQuery("");
      
      // Show success feedback (optional - could use a toast instead)
      // alert(`Favorite "${newFavoriteLabel.trim()}" added successfully!`);
    } catch (error: any) {
      console.error("Failed to add favorite:", error);
      alert(`Failed to add favorite: ${error.message || String(error)}`);
    } finally {
      setIsAddingFavorite(false);
    }
  };

  const handleCancelLabelModal = () => {
    setShowLabelModal(false);
    setSelectedFolderPath("");
    setNewFavoriteLabel("");
  };

  const handleTabChange = (tab: "favorites" | "recents") => {
    setActiveTab(tab);
    setSearchQuery(""); // Clear search when switching tabs
    setIsSearchExpanded(false); // Collapse search when switching tabs
  };

  const handleToggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchQuery(""); // Clear search when collapsing
    }
  };

  const handleSearchBlur = () => {
    // Only collapse if search query is empty
    if (!searchQuery) {
      setIsSearchExpanded(false);
    }
  };

  return (
    <>
      {/* Single Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded font-medium cursor-pointer transition-colors border bg-secondary text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 flex items-center justify-center"
        title="Open favorites and recent folders"
        aria-label="Open favorites and recent folders"
      >
        <Folder size={14} className="text-foreground" />
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
            {/* Modal Header - Add Button, Tabs, Search Icon, Close */}
            <div className="px-6 py-3 border-b border-border flex items-center gap-2">
              {/* Add Favorite Button */}
              <button
                onClick={handleAddFavorite}
                disabled={isAddingFavorite || !isElectron}
                className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Add favorite folder"
                title="Add favorite folder"
              >
                <Plus size={16} />
              </button>

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
                  Fav
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
                  Recent
                </button>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Search Icon / Expandable Search Input */}
              <div className="flex items-center">
                {isSearchExpanded ? (
                  <div className="relative flex items-center animate-in slide-in-from-right-2 duration-200">
                    <Search
                      size={14}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={handleSearchBlur}
                      placeholder={
                        activeTab === "favorites"
                          ? "Search favorites..."
                          : "Search recent..."
                      }
                      className="w-48 pl-8 pr-7 py-1.5 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
                ) : (
                  <button
                    onClick={handleToggleSearch}
                    className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Search"
                    title="Search"
                  >
                    <Search size={16} />
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSearchQuery("");
                  setActiveTab("favorites");
                  setIsSearchExpanded(false);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded hover:bg-accent flex-shrink-0"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              {/* Favorites Tab Content */}
              {activeTab === "favorites" && (
                <div>
                  {filteredFavorites.length > 0 ? (
                    <div className="space-y-1">
                      {filteredFavorites.map((fav, idx) => {
                        // Find the actual index in the full favorites array
                        const actualIndex = favorites.findIndex(f => f.path === fav.path && f.label === fav.label);
                        return (
                          <div
                            key={idx}
                            className="group relative"
                          >
                            <div
                              onClick={() => handleOpenFolder(fav.path)}
                              onContextMenu={(e) => handleRemoveFavorite(actualIndex, e)}
                              className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent transition-colors flex items-center justify-between cursor-pointer"
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
                              <div className="flex items-center gap-2 ml-2">
                                <Folder
                                  size={16}
                                  className="text-muted-foreground group-hover:text-foreground flex-shrink-0"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFavorite(actualIndex, e);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                                  title="Remove favorite"
                                  aria-label={`Remove favorite: ${fav.label}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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

          </div>
        </div>
      )}

      {/* Label Input Modal */}
      {showLabelModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={handleCancelLabelModal}
        >
          <div
            className="bg-background border border-border rounded-md p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Add Favorite</h3>
              <button
                onClick={handleCancelLabelModal}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Folder Path
                </label>
                <div className="px-3 py-2 bg-secondary border border-border rounded text-sm text-muted-foreground break-all">
                  {selectedFolderPath}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={newFavoriteLabel}
                  onChange={(e) => setNewFavoriteLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveFavoriteLabel();
                    } else if (e.key === "Escape") {
                      handleCancelLabelModal();
                    }
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter a label for this favorite"
                  maxLength={100}
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleCancelLabelModal}
                className="px-4 py-2 bg-secondary text-foreground rounded hover:bg-accent transition-colors"
                disabled={isAddingFavorite}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFavoriteLabel}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAddingFavorite || !newFavoriteLabel.trim()}
              >
                {isAddingFavorite ? "Adding..." : "Add Favorite"}
              </button>
            </div>
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

