"use client";

import { useState, useEffect, useCallback } from "react";

interface RecentFolder {
  path: string;
  lastAccessed: Date;
}

const STORAGE_KEY = "recentFolders";
const MAX_RECENT_FOLDERS = 20;

/**
 * Custom hook for managing recent folders with localStorage persistence.
 * 
 * Features:
 * - Tracks recently accessed folders with timestamps
 * - Persists to localStorage
 * - Limits to last 20 folders
 * - Removes duplicates (keeps most recent)
 * 
 * @returns Object with recent folders array and methods to manage them
 */
export function useRecentFolders() {
  const [recentFolders, setRecentFolders] = useState<RecentFolder[]>([]);

  // Load recent folders from localStorage on mount
  useEffect(() => {
    loadRecentFolders();
  }, []);

  const loadRecentFolders = useCallback(() => {
    try {
      if (typeof window === "undefined") return;

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setRecentFolders([]);
        return;
      }

      const parsed = JSON.parse(stored) as Array<{ path: string; lastAccessed: string }>;
      const folders: RecentFolder[] = parsed.map((item) => ({
        path: item.path,
        lastAccessed: new Date(item.lastAccessed),
      }));

      setRecentFolders(folders);
    } catch (error) {
      console.error("Failed to load recent folders:", error);
      setRecentFolders([]);
    }
  }, []);

  const addRecentFolder = useCallback((path: string) => {
    if (!path || typeof window === "undefined") return;

    try {
      setRecentFolders((prev) => {
        // Remove duplicate (if exists) and add to front
        const filtered = prev.filter((folder) => folder.path !== path);
        const updated = [
          { path, lastAccessed: new Date() },
          ...filtered,
        ].slice(0, MAX_RECENT_FOLDERS); // Limit to MAX_RECENT_FOLDERS

        // Persist to localStorage
        const toStore = updated.map((folder) => ({
          path: folder.path,
          lastAccessed: folder.lastAccessed.toISOString(),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));

        return updated;
      });
    } catch (error) {
      console.error("Failed to save recent folder:", error);
    }
  }, []);

  const clearRecentFolders = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      localStorage.removeItem(STORAGE_KEY);
      setRecentFolders([]);
    } catch (error) {
      console.error("Failed to clear recent folders:", error);
    }
  }, []);

  return {
    recentFolders,
    addRecentFolder,
    clearRecentFolders,
    refreshRecentFolders: loadRecentFolders,
  };
}

