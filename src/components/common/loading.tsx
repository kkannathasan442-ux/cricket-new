import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingProps {
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

/** Reusable full-area loading indicator. */
export function Loading({ label, className, fullScreen }: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        fullScreen ? "min-h-screen" : "min-h-[40vh] py-12",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-7 animate-spin text-primary" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
