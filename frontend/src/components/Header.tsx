"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { api } from "@/lib/api";
import { SearchResults } from "./SearchResults";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const pathname = usePathname();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await api.search(searchQuery);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setShowResults(false);
    }
  };

  return (
    <>
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Scriptboard</h1>
            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  pathname === "/"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                Modern
              </Link>
              <Link
                href="/new-page"
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  pathname === "/new-page"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                Classic
              </Link>
            </nav>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search prompts, attachments, responses..."
                className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSearching}
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  Searching...
                </span>
              )}
            </div>
            {showResults && searchResults && (
              <SearchResults
                results={searchResults}
                query={searchQuery}
                onClose={() => setShowResults(false)}
              />
            )}
          </form>

          <ThemeToggle />
        </div>
      </header>
    </>
  );
}

