"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TOURNAMENT_STATUSES } from "@/constants";
import type { TournamentSummary } from "@/features/tournaments/service";

const PAGE_SIZE = 10;

interface TournamentManagerProps {
  initialData: TournamentSummary[];
}

export function TournamentManager({ initialData }: TournamentManagerProps) {
  const router = useRouter();
  const [tournaments, setTournaments] = React.useState<TournamentSummary[]>(initialData);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TournamentSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TournamentSummary | null>(null);
  const [busy, setBusy] = React.useState(false);

  const filtered = React.useMemo(() => {
    return tournaments.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tournaments, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  React.useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  async function refresh() {
    try {
      const res = await fetch("/api/tournaments");
      const data = await res.json();
      if (res.ok) setTournaments(data);
    } catch {
      // ignore
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const payload = {
        tournament_name: formData.get("tournament_name") as string,
        overs_per_match: Number(formData.get("overs_per_match")),
        max_teams: Number(formData.get("max_teams")),
        players_per_team: Number(formData.get("players_per_team")),
        start_date: formData.get("start_date") as string,
        end_date: formData.get("end_date") as string,
        status: formData.get("status") as string,
      };

      const url = editing ? `/api/tournaments/${editing.id}` : "/api/tournaments";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to save tournament.");

      toast.success(editing ? "Tournament updated." : "Tournament created.");
      setModalOpen(false);
      setEditing(null);
      await refresh();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tournaments/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to delete.");
      toast.success("Tournament deleted.");
      setDeleteTarget(null);
      await refresh();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t: TournamentSummary) {
    setEditing(t);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tournaments…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                {TOURNAMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <Button variant="neon" onClick={openCreate} className="gap-2">
              <Plus className="size-4" /> New Tournament
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Overs</th>
                <th className="px-4 py-3 font-medium">Players</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No tournaments found.
                  </td>
                </tr>
              )}
              {paged.map((t) => (
                <tr key={t.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.startDate ?? "—"} {t.endDate ? `→ ${t.endDate}` : ""}
                  </td>
                  <td className="px-4 py-3">{t.oversPerMatch}</td>
                  <td className="px-4 py-3">{t.playersPerTeam}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(t)}
                        className="size-8"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(t)}
                        className="size-8 text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {safePage + 1} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Sheet open={modalOpen} onOpenChange={setModalOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl pb-safe">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Tournament" : "New Tournament"}</SheetTitle>
            <SheetDescription>
              {editing ? "Update tournament details." : "Create a new tournament."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Tournament Name</label>
              <input
                name="tournament_name"
                required
                defaultValue={editing?.name ?? ""}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Summer League 2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  name="start_date"
                  type="date"
                  required
                  defaultValue={editing?.startDate ?? ""}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input
                  name="end_date"
                  type="date"
                  required
                  defaultValue={editing?.endDate ?? ""}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Overs Per Match</label>
                <input
                  name="overs_per_match"
                  type="number"
                  min="1"
                  required
                  defaultValue={editing?.oversPerMatch ?? 20}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Players Per Team</label>
                <input
                  name="players_per_team"
                  type="number"
                  min="1"
                  required
                  defaultValue={editing?.playersPerTeam ?? 11}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Max Teams</label>
                <input
                  name="max_teams"
                  type="number"
                  min="1"
                  required
                  defaultValue={editing ? 8 : 8}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  name="status"
                  required
                  defaultValue={editing?.status ?? "upcoming"}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {TOURNAMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="neon" className="flex-1" disabled={busy}>
                {busy ? "Saving…" : editing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
          <SheetHeader>
            <SheetTitle>Delete Tournament</SheetTitle>
            <SheetDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
