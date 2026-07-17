import { PageShell } from "@/components/common/page-shell";
import { EmptyState } from "@/components/common/empty-state";
import { BarChart3 } from "lucide-react";

export default function StatsPage() {
  return (
    <PageShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-black tracking-tight">Stats</h1>
        <EmptyState
          icon={BarChart3}
          title="No stats yet"
          message="Global player statistics will appear here in a later phase."
        />
      </div>
    </PageShell>
  );
}
