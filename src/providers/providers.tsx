"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
      <Toaster />
    </NextThemesProvider>
  );
}
