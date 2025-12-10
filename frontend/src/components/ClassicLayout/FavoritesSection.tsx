"use client";

import { useState, useEffect } from "react";
import { Plus, Folder, Star } from "lucide-react";
import { api } from "@/lib/api";
import { SectionButtonRow, type ButtonConfig } from "@/components/ui";

interface Favorite {
  label: string;
  path: string;
}

/**
 * Favorites section component matching original scriptboard.py layout.
 * 
 * Displays horizontal row of favorite buttons with:
 * - Add+ button (primary, leftmost)
 * - Favorite buttons (secondary, horizontal row)
 * - Right-click to remove favorite
 */
export function FavoritesSection() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    loadFavorites();
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  const loadFavorites = async () => {
    try {
      const config = await api.getConfig();
      const favs = (config.favorites || []) as Favorite[];
      setFavorites(favs);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load favorites:", error);
      }
    }
  };

  const handleAddFavorite = async () => {
    if (isElectron) {
      try {
        const result = await (window as any).electronAPI.selectFolder();
        if (result && result.path && !result.error) {
          // TODO: Add favorite via API (update config)
          // For now, just reload
          await loadFavorites();
        }
      } catch (error) {
        console.error("Failed to select folder:", error);
      }
    } else {
      alert("Adding favorites requires Electron. Please use the desktop app.");
    }
  };

  const handleOpenFavorite = async (path: string) => {
    if (isElectron) {
      try {
        await (window as any).electronAPI.openFolder(path);
      } catch (error) {
        console.error("Failed to open folder:", error);
      }
    } else {
      alert(`Favorite path: ${path}\n\nOpening folders requires the Electron desktop app.`);
    }
  };

  const handleRemoveFavorite = async (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    if (confirm(`Remove favorite "${favorites[index].label}"?`)) {
      // TODO: Remove favorite via API (update config)
      // For now, just reload
      await loadFavorites();
    }
  };

  return (
    <div className="px-5 py-4 bg-background">
      <div className="flex justify-center gap-1">
        {/* Add+ button - Icon only */}
        <button
          onClick={handleAddFavorite}
          className="p-2 rounded-md font-medium cursor-pointer transition-colors bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/90 flex items-center justify-center"
          title="Add new favorite folder"
          aria-label="Add new favorite folder"
        >
          <Plus size={18} />
        </button>
        {/* Favorite buttons - Icon only with tooltips */}
        {favorites.map((fav, idx) => (
          <button
            key={idx}
            onClick={() => handleOpenFavorite(fav.path)}
            onContextMenu={(e) => handleRemoveFavorite(idx, e)}
            className={`p-2 rounded-md font-medium cursor-pointer transition-colors flex items-center justify-center border ${
              fav.path
                ? "bg-secondary text-primary hover:bg-accent active:bg-accent border-border"
                : "bg-secondary text-muted-foreground hover:bg-accent active:bg-accent border-border"
            }`}
            title={fav.path ? `${fav.label || "Favorite"}\nPath: ${fav.path}\n\nClick to open folder\nRight-click to remove` : `${fav.label || "Favorite"}\nNo path set`}
            aria-label={fav.path ? `Open favorite: ${fav.label || "Favorite"}` : `Favorite: ${fav.label || "Unnamed"} (no path)`}
          >
            {fav.path ? (
              <Folder size={18} />
            ) : (
              <Star size={18} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

