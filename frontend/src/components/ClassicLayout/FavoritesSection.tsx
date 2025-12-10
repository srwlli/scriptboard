"use client";

import { useState, useEffect } from "react";
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
    <div className="px-5 py-4 bg-[#010409]">
      <div className="flex justify-center gap-1">
        {/* Add+ button */}
        <button
          onClick={handleAddFavorite}
          className="px-3 py-1.5 text-sm rounded-md font-medium cursor-pointer transition-colors w-16 bg-[#1a7f37] text-white hover:bg-[#238636] active:bg-[#238636]"
        >
          Add+
        </button>
        {/* Favorite buttons */}
        {favorites.map((fav, idx) => (
          <button
            key={idx}
            onClick={() => handleOpenFavorite(fav.path)}
            onContextMenu={(e) => handleRemoveFavorite(idx, e)}
            className={`px-3 py-1.5 text-sm rounded-md font-medium cursor-pointer transition-colors w-16 ${
              fav.path
                ? "bg-[#161b22] text-[#58a6ff] hover:bg-[#21262d] active:bg-[#21262d] border border-[#21262d]"
                : "bg-[#161b22] text-[#6e7681] hover:bg-[#21262d] active:bg-[#21262d] border border-[#21262d]"
            }`}
            title={fav.path ? `Right-click to remove: ${fav.path}` : "No path set"}
          >
            {fav.label || "★"}
          </button>
        ))}
      </div>
    </div>
  );
}

