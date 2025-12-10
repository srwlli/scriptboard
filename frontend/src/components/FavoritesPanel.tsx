"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Favorite {
  label: string;
  path: string;
}

export function FavoritesPanel() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    loadFavorites();
    // Check for Electron API availability on client side only
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
      console.error("Failed to load favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteClick = async (favorite: Favorite) => {
    /**
     * Open favorite folder in system file explorer for quick drag-and-drop access.
     * This allows users to quickly navigate to project folders to drag files into the app.
     * 
     * Implementation: Uses Electron shell.openPath() to open folder in native file explorer.
     */
    if (isElectron) {
      try {
        const result = await (window as any).electronAPI.openFolder(favorite.path);
        if (result && result.error) {
          console.error("Failed to open folder:", result.error);
          alert(`Failed to open folder: ${result.error}`);
        }
      } catch (error) {
        console.error("Failed to open folder:", error);
        alert("Failed to open folder in file explorer");
      }
    } else {
      // Fallback for web: show path info (can't open file explorer in browser)
      console.log("Selected favorite:", favorite);
      alert(`Favorite: ${favorite.label}\nPath: ${favorite.path}\n\nOpening folders requires the Electron desktop app.`);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border border-border rounded-md bg-background">
        <h2 className="text-sm font-semibold mb-2 text-foreground">Favorites</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-border rounded-md bg-background">
      <h2 className="text-sm font-semibold mb-3 text-foreground">Favorites</h2>
      {favorites.length === 0 ? (
        <p className="text-sm text-muted-foreground">No favorites configured</p>
      ) : (
        <ul className="space-y-1">
          {favorites.map((fav, idx) => (
            <li key={idx}>
              <button
                onClick={() => handleFavoriteClick(fav)}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-accent text-sm text-foreground transition-colors"
              >
                <span className="font-medium">{fav.label}</span>
                <br />
                <span className="text-xs text-muted-foreground truncate block">
                  {fav.path}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

