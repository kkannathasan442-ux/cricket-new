"use client";

import * as React from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

const client = createClient();

type EventHandler = (payload: unknown) => void;

interface UseRealtimeSubscriptionOptions {
  table: string;
  schema?: string;
  filter?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  onEvent?: EventHandler;
  enabled?: boolean;
}

export function useRealtimeSubscription({
  table,
  schema = "public",
  filter,
  event = "*",
  onEvent,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const handlerRef = React.useRef<EventHandler | undefined>(onEvent);

  React.useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  React.useEffect(() => {
    if (!enabled) return;

    const activeChannel: RealtimeChannel = client
      .channel(`realtime:${table}:${filter ?? "all"}`)
      .on(
        "postgres_changes",
        { event, schema, table, filter },
        (payload) => handlerRef.current?.(payload),
      )
      .subscribe((status) => {
        setIsSubscribed(status === "SUBSCRIBED");
      });

    return () => {
      client.removeChannel(activeChannel);
      setIsSubscribed(false);
    };
  }, [table, schema, filter, event, enabled]);

  return { isSubscribed };
}
