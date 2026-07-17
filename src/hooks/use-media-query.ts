"use client";

import * as React from "react";

/** Returns true when the given media query matches. SSR-safe. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/** Convenience hook for mobile-first detection. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
