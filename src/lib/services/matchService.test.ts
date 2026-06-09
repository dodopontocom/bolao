import { describe, it, expect } from 'vitest';
import { getMatchStatus, calculatePredictionPoints, calculateOdds } from './matchService';

describe('getMatchStatus', () => {
  it('should return finished if scores are set', () => {
    const match = { id: '1', team1: 'Brazil', team2: 'Argentina', date: '2026-06-11', time: '13:00 UTC-6', ground: 'Estadio', matchDate: Date.now(), score1: 2, score2: 1 };
    expect(getMatchStatus(match)).toBe('finished');
  });
});

describe('calculatePredictionPoints', () => {
  it('should return 3 points for exact score', () => {
    expect(calculatePredictionPoints({ homeGoals: 2, awayGoals: 1 }, { homeGoals: 2, awayGoals: 1 })).toBe(3);
  });
  
  it('should return 1 point for correct winner', () => {
    expect(calculatePredictionPoints({ homeGoals: 3, awayGoals: 1 }, { homeGoals: 2, awayGoals: 1 })).toBe(1);
  });
  
  it('should return 0 points for wrong winner', () => {
    expect(calculatePredictionPoints({ homeGoals: 0, awayGoals: 2 }, { homeGoals: 2, awayGoals: 1 })).toBe(0);
  });
});

describe('calculateOdds', () => {
  it('should return 2.0 for all when no bets', () => {
    expect(calculateOdds([])).toEqual({ home: 2.0, draw: 2.0, away: 2.0 });
  });
  
  it('should calculate correct odds', () => {
    const bets = [
      { outcome: 'home' },
      { outcome: 'home' },
      { outcome: 'away' },
    ];
    const odds = calculateOdds(bets);
    expect(odds.home).toBeCloseTo(1.5);
    expect(odds.away).toBeCloseTo(3.0);
    expect(odds.draw).toBeCloseTo(2.0);
  });
});
