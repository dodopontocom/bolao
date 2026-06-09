export interface Prediction {
  matchId: string;
  userName: string;
  score1: number;
  score2: number;
  timestamp: number;
}

export interface MatchResult {
  matchId: string;
  score1: number;
  score2: number;
}

export interface UserScore {
  userName: string;
  points: number;
  exactHits: number;
  winnerHits: number;
  prevRank?: number;
  rank: number;
}

const PREDICTIONS_KEY = 'bolao_predictions';
const RESULTS_KEY = 'bolao_results';
const USER_KEY = 'bolao_user';
const ADMIN_KEY = 'bolao_admin';

export function saveUser(name: string): void {
  localStorage.setItem(USER_KEY, name);
}

export function loadUser(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

export function toggleAdmin(): boolean {
  const current = isAdmin();
  if (current) {
    localStorage.removeItem(ADMIN_KEY);
    return false;
  }
  localStorage.setItem(ADMIN_KEY, 'true');
  return true;
}

export function savePrediction(prediction: Prediction): void {
  const all = loadAllPredictions();
  const key = `${prediction.matchId}_${prediction.userName}`;
  all[key] = prediction;
  localStorage.setItem(PREDICTIONS_KEY, JSON.stringify(all));
}

export function loadPrediction(matchId: string, userName: string): Prediction | null {
  const all = loadAllPredictions();
  return all[`${matchId}_${userName}`] || null;
}

export function loadPredictionsForUser(userName: string): Prediction[] {
  const all = loadAllPredictions();
  return Object.values(all).filter((p) => p.userName === userName);
}

export function loadPredictionsForMatch(matchId: string): Prediction[] {
  const all = loadAllPredictions();
  return Object.values(all).filter((p) => p.matchId === matchId);
}

export function loadAllPredictions(): Record<string, Prediction> {
  try {
    const raw = localStorage.getItem(PREDICTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveResult(result: MatchResult): void {
  const all = loadAllResults();
  all[result.matchId] = result;
  localStorage.setItem(RESULTS_KEY, JSON.stringify(all));
}

export function loadResult(matchId: string): MatchResult | null {
  const all = loadAllResults();
  return all[matchId] || null;
}

export function loadAllResults(): Record<string, MatchResult> {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function calculateScores(
  predictions: Record<string, Prediction>,
  results: Record<string, MatchResult>
): UserScore[] {
  const userMap: Record<string, { points: number; exactHits: number; winnerHits: number }> = {};

  for (const pred of Object.values(predictions)) {
    if (!userMap[pred.userName]) {
      userMap[pred.userName] = { points: 0, exactHits: 0, winnerHits: 0 };
    }
    const result = results[pred.matchId];
    if (!result) continue;

    const predWinner = pred.score1 > pred.score2 ? 1 : pred.score1 < pred.score2 ? 2 : 0;
    const resultWinner = result.score1 > result.score2 ? 1 : result.score1 < result.score2 ? 2 : 0;

    if (pred.score1 === result.score1 && pred.score2 === result.score2) {
      userMap[pred.userName].points += 3;
      userMap[pred.userName].exactHits += 1;
    } else if (predWinner === resultWinner && predWinner !== 0) {
      userMap[pred.userName].points += 1;
      userMap[pred.userName].winnerHits += 1;
    } else if (predWinner === 0 && resultWinner === 0) {
      userMap[pred.userName].points += 1;
      userMap[pred.userName].winnerHits += 1;
    }
  }

  const scores: UserScore[] = Object.entries(userMap)
    .map(([userName, data]) => ({
      userName,
      points: data.points,
      exactHits: data.exactHits,
      winnerHits: data.winnerHits,
      rank: 0,
    }))
    .sort((a, b) => b.points - a.points || b.exactHits - a.exactHits);

  scores.forEach((s, i) => {
    s.rank = i + 1;
  });

  return scores;
}

export function getUniqueUsers(predictions: Record<string, Prediction>): string[] {
  const users = new Set(Object.values(predictions).map((p) => p.userName));
  return Array.from(users).sort();
}
