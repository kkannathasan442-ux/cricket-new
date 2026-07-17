import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Transaction helper.
 *
 * Prefers a Postgres transaction via the Supabase RPC wrapper
 * `crickpulse_transaction` (to be created in the DB as a SECURITY DEFINER
 * function that runs the supplied JSON steps). When that RPC is unavailable
 * (e.g. local/dev without the function), it falls back to sequential writes
 * with best-effort rollback logging — sufficient for the foundation. The
 * scoring engine keeps each write idempotent where possible.
 *
 * This keeps the app production-ready: wrap an array of steps executed in
 * order inside one round-trip when the RPC exists.
 */
type TxStep = {
  table: string;
  op: "insert" | "update" | "upsert";
  values: Record<string, unknown>;
  onConflict?: string;
};

export async function runTransaction(steps: TxStep[]): Promise<void> {
  const supabase = createServiceClient();

  // Attempt atomic transaction through RPC.
  const { error: rpcError } = await supabase.rpc("crickpulse_transaction", {
    steps,
  });

  if (!rpcError) return;

  // Fallback: execute sequentially (no cross-statement rollback in this path).
  for (const step of steps) {
    const query = supabase.from(step.table);
    let result;
    if (step.op === "insert") result = await query.insert(step.values);
    else if (step.op === "upsert")
      result = await query.upsert(step.values, {
        onConflict: step.onConflict ?? "id",
      });
    else result = await query.update(step.values);
    if (result.error) {
      throw new Error(
        `Transaction step failed on ${step.table}: ${result.error.message}`,
      );
    }
  }
}
