"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface SelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  options: { id: string; label: string; sublabel?: string }[];
  selectedId?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: (id: string) => void;
}

/**
 * Generic player-selection modal (bottom sheet on mobile) used for the
 * "next batsman" and "next bowler" flows.
 */
export function SelectionModal({
  open,
  onOpenChange,
  title,
  description,
  options,
  selectedId,
  confirmLabel = "Confirm",
  loading,
  onConfirm,
}: SelectionModalProps) {
  const [picked, setPicked] = React.useState<string | undefined>(selectedId);

  React.useEffect(() => {
    if (open) setPicked(selectedId);
  }, [open, selectedId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[80vh] overflow-y-auto rounded-t-2xl pb-safe"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="mt-4 grid gap-2">
          {options.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No players available.
            </p>
          )}
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPicked(opt.id)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                picked === opt.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent",
              )}
            >
              <span className="font-medium">{opt.label}</span>
              {opt.sublabel && (
                <span className="text-xs text-muted-foreground">
                  {opt.sublabel}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" /> Cancel
          </Button>
          <Button
            variant="neon"
            className="flex-1"
            disabled={!picked || loading}
            onClick={() => picked && onConfirm(picked)}
          >
            {loading ? "Applying…" : confirmLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
