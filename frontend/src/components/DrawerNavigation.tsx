"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layout, Settings } from "lucide-react";
import { Drawer } from "./ui/Drawer";

export interface DrawerNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/new-page", label: "New Page", icon: Layout },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * Drawer navigation component with navigation items.
 * 
 * Features:
 * - Navigation items: Home, New Page, Settings
 * - Icons from lucide-react
 * - Active route highlighting
 * - Closes drawer on navigation click
 * - Proper Link components for Next.js routing
 */
export function DrawerNavigation({ isOpen, onClose }: DrawerNavigationProps) {
  const pathname = usePathname();

  const handleNavClick = () => {
    // Close drawer when navigation item is clicked
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div 
          className="px-6 py-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={onClose}
          title="Click to close"
        >
          <h2 className="text-lg font-semibold text-foreground">Navigation</h2>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4" aria-label="Main navigation">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </Drawer>
  );
}

