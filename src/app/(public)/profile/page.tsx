import { PageShell } from "@/components/common/page-shell";
import { EmptyState } from "@/components/common/empty-state";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <PageShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-black tracking-tight">Profile</h1>
        <EmptyState
          icon={User}
          title="Not signed in"
          message="Sign in to view your profile and manage your teams."
        />
      </div>
    </PageShell>
  );
}
