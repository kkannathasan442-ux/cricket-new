"use client";

import * as React from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

type EventHandler = (payload: unknown) => void;

interface UseRealtimeSubscriptionOptions {
  /** Target table for the realtime subscription. */
  table: string;
  /** Optional schema filter. */
  schema?: string;
  /** Optional row filter (e.g. `id=eq.123`). */
  filter?: string;
  /** Event types to listen to. Defaults to all. */
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  /** Callback invoked on matching realtime events. */
  onEvent?: EventHandler;
  /** Whether the subscription is active. */
  enabled?: boolean;
}

/**
 * Foundation realtime subscription hook for Supabase Realtime.
 * Subscribes to a single table only (per BRD 12: avoid full-DB listeners)
 * and cleans up the channel on unmount.
 */
export function useRealtimeSubscription({
  table,
  schema = "public",
  filter,
  event = "*",
  onEvent,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const [channel, setChannel] = React.useState<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const handlerRef = React.useRef<EventHandler | undefined>(onEvent);

  React.useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  React.useEffect(() => {
    if (!enabled) return;

    const client = createClient();
    let activeChannel: RealtimeChannel = client
      .channel(`realtime:${table}:${filter ?? "all"}`)
      .on(
        "postgres_changes",
        { event, schema, table, filter },
        (payload) => handlerRef.current?.(payload),
      )
      .subscribe((status) => {
        setIsSubscribed(status === "SUBSCRIBED");
      });

    setChannel(activeChannel);

    return () => {
      client.removeChannel(activeChannel);
      setChannel(null);
      setIsSubscribed(false);
    };
  }, [table, schema, filter, event, enabled]);

  return { channel, isSubscribed };
}
