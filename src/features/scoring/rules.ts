import type { MatchResult } from "@/features/scoring";

/** Standard balls per over in limited-overs cricket. */
export const BALLS_PER_OVER = 6;

/**
 * Computes the 1-based over number and ball-within-over for the NEXT legal
 * delivery, given the count of legal balls already bowled in the innings.
 */
export function nextBallPosition(
  legalBallsBowled: number,
): { overNumber: number; ballNumber: number } {
  return {
    overNumber: Math.floor(legalBallsBowled / BALLS_PER_OVER) + 1,
    ballNumber: (legalBallsBowled % BALLS_PER_OVER) + 1,
  };
}

/** Number of completed overs from a legal-ball count. */
export function completedOvers(legalBallsBowled: number): number {
  return Math.floor(legalBallsBowled / BALLS_PER_OVER);
}

/**
 * Determines whether the strike should rotate for a legal delivery.
 * Strike rotates when the batter's runs are odd; even runs keep the strike.
 * Illegal deliveries (wide/no-ball) do NOT change strike by themselves.
 */
export function shouldRotateStrike(batterRuns: number): boolean {
  return batterRuns % 2 === 1;
}

/**
 * Determines whether an over has just been completed (a legal ball that
 * reaches the 6th ball of the over). When true, a bowler change is required
 * and the strike is NOT rotated (batsmen keep ends at end of over).
 */
export function isOverComplete(legalBallsBowledAfter: number): boolean {
  return legalBallsBowledAfter > 0 && legalBallsBowledAfter % BALLS_PER_OVER === 0;
}

/**
 * Target for the chasing innings: first-innings total + 1.
 * Returns null when there is no first innings total yet.
 */
export function computeTarget(firstInningsRuns: number): number {
  return firstInningsRuns + 1;
}

/**
 * Match result engine (BRD 6.8).
 * Compares first and second innings totals to resolve the outcome.
 */
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

  // Tie.
  if (firstRuns === secondRuns) {
    return {
      resultType: "tie",
      winnerId: null,
      margin: 0,
      firstTeamId,
      secondTeamId,
    };
  }

  // Second innings has won (chased the target).
  if (secondRuns > firstRuns) {
    return {
      resultType: "win_by_wickets",
      winnerId: secondTeamId,
      margin: 10 - secondWickets,
      firstTeamId,
      secondTeamId,
    };
  }

  // First innings has won. If the chase was not completed it's a no-result;
  // otherwise it's a win by runs.
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

/**
 * Net Run Rate (NRR) for a team: (runs for / balls faced) - (runs against / balls bowled).
 * `balls` values are legal-ball counts.
 */
export function calculateNRR(params: {
  runsFor: number;
  ballsFaced: number;
  runsAgainst: number;
  ballsBowled: number;
}): number {
  const forRate = params.ballsFaced > 0 ? params.runsFor / params.ballsFaced : 0;
  const againstRate =
    params.ballsBowled > 0 ? params.runsAgainst / params.ballsBowled : 0;
  return Number((forRate - againstRate).toFixed(3));
}

/** Converts an overs display value (e.g. 19.5) to a legal-ball count. */
export function oversToBalls(overs: number): number {
  const completed = Math.floor(overs);
  const remainder = Math.round((overs - completed) * 10);
  return completed * BALLS_PER_OVER + remainder;
}

/** Current Run Rate from runs and legal balls bowled. */
export function currentRunRate(runs: number, ballsBowled: number): number {
  if (ballsBowled <= 0) return 0;
  return Number(((runs / ballsBowled) * BALLS_PER_OVER).toFixed(2));
}

/** Required Run Rate for the chasing team. */
export function requiredRunRate(
  target: number,
  runsSoFar: number,
  ballsRemaining: number,
): number {
  const needed = target - runsSoFar;
  if (ballsRemaining <= 0 || needed <= 0) return 0;
  return Number(((needed / ballsRemaining) * BALLS_PER_OVER).toFixed(2));
}
