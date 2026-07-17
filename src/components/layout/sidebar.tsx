"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
  Users,
} from "lucide-react";

import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/teams", label: "Teams", icon: Trophy },
  { href: "/admin/tournaments", label: "Tournaments", icon: Settings },
];

/**
 * Desktop sidebar for admin routes. Hidden below md.
 * (Foundation only — admin pages are built in later phases.)
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/50 md:block">
      <div className="flex h-14 items-center border-b border-border/60 px-6">
        <span className="text-lg font-black tracking-tight">
          Crick<span className="neon-text">Pulse</span>
        </span>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 border-t border-border/60 pt-4">
          <Link
            href="/auth/logout"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </Link>
        </div>
      </nav>
    </aside>
  );
}
