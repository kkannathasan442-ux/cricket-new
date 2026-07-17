"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PLAYER_ROLES } from "@/constants";
import type { Player } from "@/features/players/service";
import type { Team } from "@/features/teams/service";

const PAGE_SIZE = 10;

interface PlayerManagerProps {
  initialPlayers: Player[];
  initialTeams: Team[];
}

export function PlayerManager({ initialPlayers, initialTeams }: PlayerManagerProps) {
  const router = useRouter();
  const [players, setPlayers] = React.useState<Player[]>(initialPlayers);
  const [teams] = React.useState<Team[]>(initialTeams);
  const [search, setSearch] = React.useState("");
  const [teamFilter, setTeamFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Player | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Player | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const filtered = React.useMemo(() => {
    return players.filter((p) => {
      const matchesSearch = p.player_name.toLowerCase().includes(search.toLowerCase());
      const matchesTeam = teamFilter === "all" || p.team_id === teamFilter;
      return matchesSearch && matchesTeam;
    });
  }, [players, search, teamFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  React.useEffect(() => {
    setPage(0);
  }, [search, teamFilter]);

  async function refresh() {
    try {
      const res = await fetch("/api/players");
      const data = await res.json();
      if (res.ok) setPlayers(data);
    } catch {
      // ignore
    }
  }

  async function handlePhotoUpload(playerId: string, file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "player-photos");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Upload failed.");

      await fetch(`/api/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: data.url }),
      });

      toast.success("Photo uploaded.");
      await refresh();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const payload = {
        player_name: formData.get("player_name") as string,
        role: formData.get("role") as string,
        team_id: formData.get("team_id") as string,
        jersey_name: (formData.get("jersey_name") as string) || null,
        jersey_number: formData.get("jersey_number") ? Number(formData.get("jersey_number")) : null,
        contact_number: (formData.get("contact_number") as string) || null,
      };

      const url = editing ? `/api/players/${editing.id}` : "/api/players";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to save player.");

      toast.success(editing ? "Player updated." : "Player created.");
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
      const res = await fetch(`/api/players/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to delete.");
      toast.success("Player deleted.");
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

  function openEdit(p: Player) {
    setEditing(p);
    setModalOpen(true);
  }

  const teamName = (teamId: string) => teams.find((t) => t.id === teamId)?.team_name ?? "Unknown";

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
                  placeholder="Search players…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
                />
              </div>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="all">All teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.team_name}</option>
                ))}
              </select>
            </div>
            <Button variant="neon" onClick={openCreate} className="gap-2">
              <Plus className="size-4" /> New Player
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Photo</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Jersey</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No players found.
                  </td>
                </tr>
              )}
              {paged.map((p) => (
                <tr key={p.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3">
                    {p.photo_url ? (
                      <Image src={p.photo_url} alt={p.player_name} width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{p.player_name}</td>
                  <td className="px-4 py-3">{teamName(p.team_id)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {p.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.jersey_number ?? "—"}
                    {p.jersey_name ? ` (${p.jersey_name})` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.contact_number ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(p.id, file);
                          }}
                        />
                        <Button variant="ghost" size="icon" className="size-8" disabled={uploading}>
                          <Upload className="size-4" />
                        </Button>
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}
                        className="size-8"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(p)}
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
            <SheetTitle>{editing ? "Edit Player" : "New Player"}</SheetTitle>
            <SheetDescription>
              {editing ? "Update player details." : "Add a new player to the system."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Player Name</label>
              <input
                name="player_name"
                required
                defaultValue={editing?.player_name ?? ""}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Virat Kohli"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  name="role"
                  required
                  defaultValue={editing?.role ?? "batsman"}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {PLAYER_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Team</label>
                <select
                  name="team_id"
                  required
                  defaultValue={editing?.team_id ?? ""}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.team_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Jersey Number</label>
                <input
                  name="jersey_number"
                  type="number"
                  min="0"
                  defaultValue={editing?.jersey_number ?? ""}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. 18"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Jersey Name</label>
                <input
                  name="jersey_name"
                  defaultValue={editing?.jersey_name ?? ""}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  placeholder="e.g. KOHLI"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Contact Number</label>
              <input
                name="contact_number"
                defaultValue={editing?.contact_number ?? ""}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. +91 98765 43210"
              />
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
            <SheetTitle>Delete Player</SheetTitle>
            <SheetDescription>
              Are you sure you want to delete &quot;{deleteTarget?.player_name}&quot;? This action cannot be undone.
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
