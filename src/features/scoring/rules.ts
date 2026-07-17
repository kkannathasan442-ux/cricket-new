import type { MatchResult } from "@/features/scoring";

export const BALLS_PER_OVER = 6;

export function nextBallPosition(
  legalBallsBowled: number,
): { overNumber: number; ballNumber: number } {
  return {
    overNumber: Math.floor(legalBallsBowled / BALLS_PER_OVER) + 1,
    ballNumber: (legalBallsBowled % BALLS_PER_OVER) + 1,
  };
}

export function isOverComplete(legalBallsBowledAfter: number): boolean {
  return legalBallsBowledAfter > 0 && legalBallsBowledAfter % BALLS_PER_OVER === 0;
}

export function computeTarget(firstInningsRuns: number): number {
  return firstInningsRuns + 1;
}

export function resolveMatchResult(params: {
  firstRuns: number;
  secondRuns: number;
  firstWickets: number;
  secondWickets: number;
  firstTeamId: string;
  secondTeamId: string;
  maxOvers: number;
  secondBallsBowled: number;
}): MatchResult & { firstTeamId: string; secondTeamId: string } {
  const {
    firstRuns,
    secondRuns,
    firstWickets,
    secondWickets,
    firstTeamId,
    secondTeamId,
    maxOvers,
    secondBallsBowled,
  } = params;

  if (firstRuns === secondRuns) {
    return {
      resultType: "tie",
      winnerId: null,
      margin: 0,
      firstTeamId,
      secondTeamId,
    };
  }

  if (secondRuns > firstRuns) {
    return {
      resultType: "win_by_wickets",
      winnerId: secondTeamId,
      margin: 10 - secondWickets,
      firstTeamId,
      secondTeamId,
    };
  }

  const chaseCompleted =
    secondBallsBowled >= maxOvers * BALLS_PER_OVER || secondWickets >= 10;
  if (!chaseCompleted) {
    return {
      resultType: "no_result",
      winnerId: null,
      margin: null,
      firstTeamId,
      secondTeamId,
    };
  }

  return {
    resultType: "win_by_runs",
    winnerId: firstTeamId,
    margin: firstRuns - secondRuns,
    firstTeamId,
    secondTeamId,
  };
}

export function currentRunRate(runs: number, ballsBowled: number): number {
  if (ballsBowled <= 0) return 0;
  return Number(((runs / ballsBowled) * BALLS_PER_OVER).toFixed(2));
}

export function requiredRunRate(
  target: number,
  runsSoFar: number,
  ballsRemaining: number,
): number {
  const needed = target - runsSoFar;
  if (ballsRemaining <= 0 || needed <= 0) return 0;
  return Number(((needed / ballsRemaining) * BALLS_PER_OVER).toFixed(2));
}
