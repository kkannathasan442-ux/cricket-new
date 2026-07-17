"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlayerOpt {
  id: string;
  playerName: string;
  role: string;
}

interface MatchStartWizardProps {
  matchId: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  teamAPlayers: PlayerOpt[];
  teamBPlayers: PlayerOpt[];
  playersPerTeam: number;
}

export function MatchStartWizard({
  matchId,
  teamAId,
  teamBId,
  teamAName,
  teamBName,
  teamAPlayers,
  teamBPlayers,
  playersPerTeam,
}: MatchStartWizardProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  const [tossWinner, setTossWinner] = React.useState<"A" | "B">("A");
  const [decision, setDecision] = React.useState<"bat" | "bowl">("bat");
  const [xiA, setXiA] = React.useState<string[]>([]);
  const [xiB, setXiB] = React.useState<string[]>([]);
  const [strikerA, setStrikerA] = React.useState<string>("");
  const [nonStrikerA, setNonStrikerA] = React.useState<string>("");
  const [strikerB, setStrikerB] = React.useState<string>("");
  const [nonStrikerB, setNonStrikerB] = React.useState<string>("");
  const [bowler, setBowler] = React.useState<string>("");

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  const XISelector = ({
    name,
    players,
    selected,
    onToggle,
  }: {
    name: string;
    players: PlayerOpt[];
    selected: string[];
    onToggle: (id: string) => void;
  }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {name} — Playing XI ({selected.length}/{playersPerTeam})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {players.map((p) => {
          const active = selected.includes(p.id);
          const disabled = !active && selected.length >= playersPerTeam;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(p.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                active
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border hover:bg-accent disabled:opacity-40",
              )}
            >
              {p.playerName}
            </button>
          );
        })}
        {players.length === 0 && (
          <span className="text-sm text-muted-foreground">No players</span>
        )}
      </CardContent>
    </Card>
  );

  const openingA = tossWinner === "A" ? decision : decision === "bat" ? "bowl" : "bat";
  const battingTeam = openingA === "bat" ? "A" : "B";

  const battingXi =
    battingTeam === "A"
      ? xiA
      : xiB;
  const bowlingXi =
    battingTeam === "A"
      ? xiB
      : xiA;

  const battingPlayers =
    battingTeam === "A"
      ? teamAPlayers
      : teamBPlayers;
  const bowlingPlayers =
    battingTeam === "A"
      ? teamBPlayers
      : teamAPlayers;

  const strikerOptions = battingPlayers.filter((p) => battingXi.includes(p.id));
  const nonStrikerOptions = battingPlayers.filter((p) => battingXi.includes(p.id) && p.id !== strikerA && p.id !== strikerB);
  const bowlerOptions = bowlingPlayers.filter((p) => bowlingXi.includes(p.id));

  async function submit() {
    setBusy(true);
    try {
      if (xiA.length !== playersPerTeam || xiB.length !== playersPerTeam) {
        toast.error(`Each team must have exactly ${playersPerTeam} players selected.`);
        setBusy(false);
        return;
      }

      const currentStriker = battingTeam === "A" ? strikerA : strikerB;
      const currentNonStriker = battingTeam === "A" ? nonStrikerA : nonStrikerB;

      if (!currentStriker || !currentNonStriker || !bowler) {
        toast.error("Please select both opening batters and the opening bowler.");
        setBusy(false);
        return;
      }

      if (!battingXi.includes(currentStriker)) {
        toast.error("Striker must be in the batting team's Playing XI.");
        setBusy(false);
        return;
      }
      if (!battingXi.includes(currentNonStriker)) {
        toast.error("Non-striker must be in the batting team's Playing XI.");
        setBusy(false);
        return;
      }
      if (!bowlingXi.includes(bowler)) {
        toast.error("Opening bowler must be in the bowling team's Playing XI.");
        setBusy(false);
        return;
      }

      const res = await fetch(`/api/match/${matchId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamAId,
          teamBId,
          tossWinnerId: tossWinner === "A" ? teamAId : teamBId,
          tossDecision: decision,
          teamAPlayers: xiA,
          teamBPlayers: xiB,
          openingBatsmen: {
            teamId: battingTeam === "A" ? teamAId : teamBId,
            strikerId: currentStriker,
            nonStrikerId: currentNonStriker,
          },
          openingBowlerId: bowler,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to start match.");
      toast.success("Match started — live scoring enabled.");
      router.push(`/matches/${matchId}/score`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Toss</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={tossWinner === "A" ? "neon" : "outline"}
              onClick={() => setTossWinner("A")}
            >
              {teamAName}
            </Button>
            <Button
              variant={tossWinner === "B" ? "neon" : "outline"}
              onClick={() => setTossWinner("B")}
            >
              {teamBName}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={decision === "bat" ? "neon" : "outline"}
              onClick={() => setDecision("bat")}
            >
              Bat
            </Button>
            <Button
              variant={decision === "bowl" ? "neon" : "outline"}
              onClick={() => setDecision("bowl")}
            >
              Bowl
            </Button>
          </div>
        </CardContent>
      </Card>

      <XISelector
        name={teamAName}
        players={teamAPlayers}
        selected={xiA}
        onToggle={(id) => setXiA((l) => toggle(l, id))}
      />
      <XISelector
        name={teamBName}
        players={teamBPlayers}
        selected={xiB}
        onToggle={(id) => setXiB((l) => toggle(l, id))}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Openers</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted-foreground">Striker ({battingTeam === "A" ? teamAName : teamBName})</span>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-2"
              value={battingTeam === "A" ? strikerA : strikerB}
              onChange={(e) =>
                battingTeam === "A" ? setStrikerA(e.target.value) : setStrikerB(e.target.value)
              }
            >
              <option value="">Select</option>
              {strikerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.playerName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Non-striker</span>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-2"
              value={battingTeam === "A" ? nonStrikerA : nonStrikerB}
              onChange={(e) =>
                battingTeam === "A"
                  ? setNonStrikerA(e.target.value)
                  : setNonStrikerB(e.target.value)
              }
            >
              <option value="">Select</option>
              {nonStrikerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.playerName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-muted-foreground">Opening bowler</span>
            <select
              className="mt-1 w-full rounded-md border bg-background px-2 py-2"
              value={bowler}
              onChange={(e) => setBowler(e.target.value)}
            >
              <option value="">Select</option>
              {bowlerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.playerName}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      <Button
        variant="neon"
        size="lg"
        className="w-full"
        disabled={busy || xiA.length !== playersPerTeam || xiB.length !== playersPerTeam}
        onClick={submit}
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Users className="size-4" />}
        Start Match
      </Button>
    </div>
  );
}
