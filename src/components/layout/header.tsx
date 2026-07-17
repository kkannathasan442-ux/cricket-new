import Link from "next/link";

import { APP_NAME } from "@/constants";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  className?: string;
}

/**
 * Sticky top header used across public & app routes.
 * Sports-style with neon brand accent.
 */
export function Header({ title, showLogo = true, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md",
        className,
      )}
    >
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {showLogo && (
            <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary shadow-neon">
              <span className="text-sm font-black neon-text">C</span>
            </span>
          )}
          <span className="text-lg font-black tracking-tight">
            {title ?? (
              <>
                Crick<span className="neon-text">Pulse</span>
              </>
            )}
          </span>
        </Link>
      </Container>
    </header>
  );
}
