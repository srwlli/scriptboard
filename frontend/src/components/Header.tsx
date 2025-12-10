"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { DrawerNavigation } from "./DrawerNavigation";
import { FavoritesDropdownMockup } from "./ClassicLayout/FavoritesDropdownMockup";

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Drawer trigger button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <Menu size={20} className="text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Scriptboard</h1>
          </div>
          
          {/* Favorites Button - Top Right */}
          <div className="flex items-center">
            <FavoritesDropdownMockup />
          </div>
        </div>
      </header>

      {/* Drawer Navigation */}
      <DrawerNavigation isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

