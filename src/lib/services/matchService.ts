import { Match } from '@/data/matches';

export function getMatchStatus(match: Match, now: number = Date.now()): 'upcoming' | 'open' | 'closed' | 'finished' {
  if (match.score1 !== undefined && match.score2 !== undefined) return 'finished';
  const matchDate = match.matchDate || new Date(match.date).getTime();
  const closeTime = matchDate - 30 * 60 * 1000;
  if (now > matchDate) return 'closed';
  if (now > closeTime) return 'closed';
  return 'open';
}

export function calculatePredictionPoints(
  prediction: { homeGoals: number; awayGoals: number },
  result: { homeGoals: number; awayGoals: number }
): number {
  if (prediction.homeGoals === result.homeGoals && prediction.awayGoals === result.awayGoals) {
    return 3;
  }
  const predWinner = getWinner(prediction.homeGoals, prediction.awayGoals);
  const actualWinner = getWinner(result.homeGoals, result.awayGoals);
  if (predWinner === actualWinner) return 1;
  return 0;
}

function getWinner(home: number, away: number): 'home' | 'away' | 'draw' {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

export function calculateOdds(bets: { outcome: 'home' | 'draw' | 'away' }[]): { home: number; draw: number; away: number } {
  const total = bets.length;
  if (total === 0) return { home: 2.0, draw: 2.0, away: 2.0 };
  
  const homeBets = bets.filter(b => b.outcome === 'home').length;
  const drawBets = bets.filter(b => b.outcome === 'draw').length;
  const awayBets = bets.filter(b => b.outcome === 'away').length;
  
  return {
    home: homeBets > 0 ? Math.max(1.1, total / homeBets) : 2.0,
    draw: drawBets > 0 ? Math.max(1.1, total / drawBets) : 2.0,
    away: awayBets > 0 ? Math.max(1.1, total / awayBets) : 2.0,
  };
}
