"use client";

import * as React from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [open, setOpen] = React.useState(false);
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      setDeferred(ev);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const result = await deferred.userChoice;
    if (result.outcome === "accepted") {
      setOpen(false);
      setDeferred(null);
    }
  }

  if (!deferred) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
        <SheetHeader>
          <SheetTitle>Install CrickPulse</SheetTitle>
          <SheetDescription>
            Add CrickPulse to your home screen for quick access to live scores, even when you are offline.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Not now
          </Button>
          <Button variant="neon" className="flex-1" onClick={install}>
            <Download className="size-4" /> Install
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
