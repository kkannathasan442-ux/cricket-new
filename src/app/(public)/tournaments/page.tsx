import { PageShell } from "@/components/common/page-shell";
import { EmptyState } from "@/components/common/empty-state";
import { Trophy } from "lucide-react";

export default function TournamentsPage() {
  return (
    <PageShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-black tracking-tight">Tournaments</h1>
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          message="Tournament listings will appear here in Phase 2."
        />
      </div>
    </PageShell>
  );
}
