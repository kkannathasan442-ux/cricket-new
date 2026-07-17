import { PageShell } from "@/components/common/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLACEHOLDERS = [
  { label: "Live Matches", value: "—" },
  { label: "Tournaments", value: "—" },
  { label: "Teams", value: "—" },
  { label: "Players", value: "—" },
];

export default function AdminDashboard() {
  return (
    <PageShell withBottomNav={false} fluid className="md:py-6">
      <div className="px-4 md:px-6">
        <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tournament, team, player and scoring management arrive in later phases.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {PLACEHOLDERS.map((item) => (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black neon-text">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
