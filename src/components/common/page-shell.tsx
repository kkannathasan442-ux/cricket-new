import * as React from "react";

import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render without the max-width container (e.g. for full-bleed scoring UI). */
  fluid?: boolean;
  /** Apply bottom padding to clear the mobile bottom nav. */
  withBottomNav?: boolean;
}

/**
 * Standard page wrapper that applies consistent spacing and clears the
 * fixed mobile bottom navigation. Foundation building block for all pages.
 */
export function PageShell({
  children,
  className,
  fluid = false,
  withBottomNav = true,
  ...props
}: PageShellProps) {
  return (
    <div
      className={cn(
        withBottomNav && "pb-20 md:pb-0",
        "min-h-[calc(100vh-3.5rem)]",
        className,
      )}
      {...props}
    >
      {fluid ? children : <Container className="py-6">{children}</Container>}
    </div>
  );
}
