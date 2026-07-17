"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Home,
  type LucideIcon,
  Trophy,
  User,
} from "lucide-react";

import { BOTTOM_NAV_ITEMS } from "@/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Home,
  Activity,
  Trophy,
  BarChart3,
  User,
};

/**
 * Fixed mobile bottom navigation (touch-friendly, safe-area aware).
 * Hidden on md+ where the sidebar takes over.
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 pb-safe backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon] ?? Home;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5", active && "neon-glow rounded-md p-0.5")}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
