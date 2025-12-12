"use client";

import { SectionDivider } from "@/components/ui";

/**
 * Favorites section component.
 * 
 * Note: The favorites button has been moved to the Header (top right).
 * This section is kept for layout consistency but is now empty.
 */
export function FavoritesSection() {
  return (
    <>
      <div className="px-5 py-2 bg-background">
        {/* Favorites button moved to Header */}
      </div>
      <SectionDivider />
    </>
  );
}

