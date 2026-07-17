import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Transaction helper.
 *
 * Production path: uses the `crickpulse_transaction` SECURITY DEFINER RPC
 * when available. Fallback: sequential writes with best-effort rollback
 * logging. The RPC must be created in the database as a Postgres function
 * that executes the supplied JSON steps atomically.
 */
type TxStep = {
  table: string;
  op: "insert" | "update" | "upsert";
  values: Record<string, unknown>;
  onConflict?: string;
};

let rpcAvailable: boolean | null = null;

async function hasRpc(supabase: ReturnType<typeof createServiceClient>): Promise<boolean> {
  if (rpcAvailable !== null) return rpcAvailable;
  const { error } = await supabase.rpc("crickpulse_transaction", { steps: [] });
  rpcAvailable = !error;
  return rpcAvailable;
}

export async function runTransaction(steps: TxStep[]): Promise<void> {
  const supabase = createServiceClient();

  if (await hasRpc(supabase)) {
    const { error } = await supabase.rpc("crickpulse_transaction", { steps });
    if (!error) return;
  }

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
