export interface Match {
  id: string;
  round: string;
  num?: number;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  score1?: number;
  score2?: number;
  matchDate: number;
}

export interface WorldCupData {
  name: string;
  matches: RawMatch[];
}

interface RawMatch {
  round: string;
  num?: number;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
}

const DATA_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

function parseDate(dateStr: string, timeStr: string): Date {
  const utcOffset = timeStr.match(/UTC([+-]?\d+)/);
  const offset = utcOffset ? parseInt(utcOffset[1]) : 0;
  const cleanTime = timeStr.replace(/\s*UTC[+-]?\d+/, '').trim();
  const [hours, minutes] = cleanTime.split(':').map(Number);
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCHours(hours - offset, minutes || 0, 0, 0);
  return date;
}

export async function fetchMatches(): Promise<Match[]> {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: WorldCupData = await res.json();
    return data.matches.map((m, i) => ({
      id: m.num?.toString() || `group-${i + 1}`,
      round: m.round,
      num: m.num,
      date: m.date,
      time: m.time,
      team1: m.team1,
      team2: m.team2,
      group: m.group,
      ground: m.ground,
      matchDate: parseDate(m.date, m.time).getTime(),
    }));
  } catch (err) {
    console.error('Failed to fetch matches:', err);
    return getFallbackMatches();
  }
}

function getFallbackMatches(): Match[] {
  return [
    { id: '1', round: 'Matchday 1', date: '2026-06-11', time: '13:00 UTC-6', team1: 'Mexico', team2: 'South Africa', group: 'Group A', ground: 'Mexico City', matchDate: new Date('2026-06-11T19:00:00Z').getTime() },
    { id: '2', round: 'Matchday 1', date: '2026-06-11', time: '20:00 UTC-6', team1: 'South Korea', team2: 'Czech Republic', group: 'Group A', ground: 'Guadalajara', matchDate: new Date('2026-06-12T02:00:00Z').getTime() },
    { id: '3', round: 'Matchday 2', date: '2026-06-12', time: '15:00 UTC-4', team1: 'Canada', team2: 'Bosnia & Herzegovina', group: 'Group B', ground: 'Toronto', matchDate: new Date('2026-06-12T19:00:00Z').getTime() },
    { id: '4', round: 'Matchday 3', date: '2026-06-13', time: '18:00 UTC-4', team1: 'Brazil', team2: 'Morocco', group: 'Group C', ground: 'New York/New Jersey', matchDate: new Date('2026-06-13T22:00:00Z').getTime() },
    { id: '5', round: 'Matchday 2', date: '2026-06-12', time: '18:00 UTC-7', team1: 'USA', team2: 'Paraguay', group: 'Group D', ground: 'Los Angeles', matchDate: new Date('2026-06-13T01:00:00Z').getTime() },
    { id: '6', round: 'Matchday 4', date: '2026-06-14', time: '12:00 UTC-5', team1: 'Germany', team2: 'Curaçao', group: 'Group E', ground: 'Houston', matchDate: new Date('2026-06-14T17:00:00Z').getTime() },
    { id: '7', round: 'Matchday 4', date: '2026-06-14', time: '15:00 UTC-5', team1: 'Netherlands', team2: 'Japan', group: 'Group F', ground: 'Dallas', matchDate: new Date('2026-06-14T20:00:00Z').getTime() },
    { id: '8', round: 'Matchday 5', date: '2026-06-15', time: '12:00 UTC-7', team1: 'Belgium', team2: 'Egypt', group: 'Group G', ground: 'Seattle', matchDate: new Date('2026-06-15T19:00:00Z').getTime() },
    { id: '9', round: 'Matchday 5', date: '2026-06-15', time: '12:00 UTC-4', team1: 'Spain', team2: 'Cape Verde', group: 'Group H', ground: 'Atlanta', matchDate: new Date('2026-06-15T16:00:00Z').getTime() },
    { id: '10', round: 'Matchday 6', date: '2026-06-16', time: '15:00 UTC-4', team1: 'France', team2: 'Senegal', group: 'Group I', ground: 'New York/New Jersey', matchDate: new Date('2026-06-16T19:00:00Z').getTime() },
    { id: '11', round: 'Matchday 6', date: '2026-06-16', time: '20:00 UTC-5', team1: 'Argentina', team2: 'Algeria', group: 'Group J', ground: 'Kansas City', matchDate: new Date('2026-06-17T01:00:00Z').getTime() },
    { id: '12', round: 'Matchday 7', date: '2026-06-17', time: '12:00 UTC-5', team1: 'Portugal', team2: 'DR Congo', group: 'Group K', ground: 'Houston', matchDate: new Date('2026-06-17T17:00:00Z').getTime() },
    { id: '13', round: 'Matchday 7', date: '2026-06-17', time: '15:00 UTC-5', team1: 'England', team2: 'Croatia', group: 'Group L', ground: 'Dallas', matchDate: new Date('2026-06-17T20:00:00Z').getTime() },
  ];
}

export function isGroupStage(match: Match): boolean {
  return match.round.startsWith('Matchday');
}

export function isKnockoutStage(match: Match): boolean {
  return !isGroupStage(match);
}

export function getMatchStatus(match: Match, now: number = Date.now()): 'upcoming' | 'open' | 'closed' | 'finished' {
  if (match.score1 !== undefined && match.score2 !== undefined) return 'finished';
  const matchDate = match.matchDate || new Date(match.date).getTime();
  const closeTime = matchDate - 30 * 60 * 1000;
  if (now > matchDate) return 'closed';
  if (now > closeTime) return 'closed';
  return 'open';
}
