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
import type { Team } from "@/features/teams/service";

const PAGE_SIZE = 10;

interface TeamManagerProps {
  initialData: Team[];
}

export function TeamManager({ initialData }: TeamManagerProps) {
  const router = useRouter();
  const [teams, setTeams] = React.useState<Team[]>(initialData);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Team | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Team | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const filtered = React.useMemo(() => {
    return teams.filter((t) =>
      t.team_name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [teams, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  async function refresh() {
    try {
      const res = await fetch("/api/teams");
      const data = await res.json();
      if (res.ok) setTeams(data);
    } catch {
      // ignore
    }
  }

  async function handleLogoUpload(teamId: string, file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "team-logos");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Upload failed.");

      await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: data.url }),
      });

      toast.success("Logo uploaded.");
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
        team_name: formData.get("team_name") as string,
        owner_name: formData.get("owner_name") as string,
        owner_phone: (formData.get("owner_phone") as string) || null,
      };

      const url = editing ? `/api/teams/${editing.id}` : "/api/teams";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to save team.");

      toast.success(editing ? "Team updated." : "Team created.");
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
      const res = await fetch(`/api/teams/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to delete.");
      toast.success("Team deleted.");
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

  function openEdit(t: Team) {
    setEditing(t);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search teams…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <Button variant="neon" onClick={openCreate} className="gap-2">
              <Plus className="size-4" /> New Team
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Logo</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No teams found.
                  </td>
                </tr>
              )}
              {paged.map((t) => (
                <tr key={t.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-3">
                    {t.logo_url ? (
                      <Image src={t.logo_url} alt={t.team_name} width={40} height={40} className="rounded-md object-cover" />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                        No logo
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{t.team_name}</td>
                  <td className="px-4 py-3">{t.owner_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.owner_phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleLogoUpload(t.id, file);
                          }}
                        />
                        <Button variant="ghost" size="icon" className="size-8" disabled={uploading}>
                          <Upload className="size-4" />
                        </Button>
                      </label>
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
            <SheetTitle>{editing ? "Edit Team" : "New Team"}</SheetTitle>
            <SheetDescription>
              {editing ? "Update team details." : "Create a new team."}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Team Name</label>
              <input
                name="team_name"
                required
                defaultValue={editing?.team_name ?? ""}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Mumbai Indians"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Owner Name</label>
              <input
                name="owner_name"
                required
                defaultValue={editing?.owner_name ?? ""}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. John Doe"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Owner Phone</label>
              <input
                name="owner_phone"
                defaultValue={editing?.owner_phone ?? ""}
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
            <SheetTitle>Delete Team</SheetTitle>
            <SheetDescription>
              Are you sure you want to delete &quot;{deleteTarget?.team_name}&quot;? This action cannot be undone.
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
