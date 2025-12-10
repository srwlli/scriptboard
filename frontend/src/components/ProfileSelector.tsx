"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface Profile {
  name: string;
  description?: string;
}

export function ProfileSelector() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await api.listProfiles();
      setProfiles((data.profiles || []) as Profile[]);
    } catch (error) {
      console.error("Failed to load profiles:", error);
    }
  };

  const handleLoadProfile = async (profileName: string) => {
    setLoading(true);
    try {
      await api.loadProfile(profileName);
      setCurrentProfile(profileName);
      // Reload config to get updated favorites/LLM URLs
      window.location.reload(); // Simple reload to refresh all panels
    } catch (error) {
      console.error("Failed to load profile:", error);
      alert(`Failed to load profile: ${profileName}`);
    } finally {
      setLoading(false);
    }
  };

  if (profiles.length === 0) {
    return null; // Don't show if no profiles
  }

  return (
    <div className="p-2 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-foreground">Profile:</label>
        <select
          value={currentProfile || ""}
          onChange={(e) => {
            if (e.target.value) {
              handleLoadProfile(e.target.value);
            }
          }}
          disabled={loading}
          className="px-2 py-1 text-xs rounded-md border border-border bg-background text-foreground disabled:opacity-50"
        >
          <option value="">Default</option>
          {profiles.map((profile) => (
            <option key={profile.name} value={profile.name}>
              {profile.name}
            </option>
          ))}
        </select>
        {loading && (
          <span className="text-xs text-muted-foreground">Loading...</span>
        )}
      </div>
    </div>
  );
}

