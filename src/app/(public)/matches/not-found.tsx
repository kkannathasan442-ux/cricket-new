import { PageShell } from "@/components/common/page-shell";
import { EmptyState } from "@/components/common/empty-state";

export default function NotFoundMatches() {
  return (
    <PageShell>
      <EmptyState
        title="Match not found"
        message="This match may have been removed or never existed."
      />
    </PageShell>
  );
}
