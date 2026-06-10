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
  // matches formats like "13:00 UTC-6" or "13:00 UTC+2" or "13:00 UTC"
  const utcOffsetMatch = timeStr.match(/UTC\s*([+-]\d+)?/i);
  const offset = utcOffsetMatch && utcOffsetMatch[1] ? parseInt(utcOffsetMatch[1]) : 0;
  
  // Clean time string from "13:00 UTC-6" to "13:00"
  const cleanTime = timeStr.replace(/UTC\s*([+-]\d+)?/i, '').trim();
  const [hours, minutes] = cleanTime.split(':').map(Number);
  
  // 1. Create a date object interpreting the string as UTC first
  const date = new Date(`${dateStr}T${hours.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}:00Z`);
  
  // 2. Subtract the offset to get the TRUE UTC time
  // If it's 13:00 in UTC-6, the true UTC time is 19:00 (13 - (-6))
  date.setUTCHours(date.getUTCHours() - offset);
  
  return date;
}

export async function fetchMatches(): Promise<Match[]> {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: WorldCupData = await res.json();
    return data.matches.map((m, i) => {
      // Create a stable ID if num is missing: "Team1-Team2-Date"
      const stableId = `${m.team1}-${m.team2}-${m.date}`.toLowerCase().replace(/\s+/g, '-');
      const id = m.num?.toString() || stableId;
      return {
        id,
        round: m.round,
        num: m.num,
        date: m.date,
        time: m.time,
        team1: m.team1,
        team2: m.team2,
        group: m.group,
        ground: m.ground,
        matchDate: parseDate(m.date, m.time).getTime(),
      };
    });
  } catch (err) {
    console.error('Failed to fetch matches:', err);
    return getFallbackMatches();
  }
}

function getFallbackMatches(): Match[] {
  // Utility to create UTC timestamp from local date/time + offset
  const toUTC = (d: string, t: string) => parseDate(d, t).getTime();

  return [
    { id: '1', round: 'Matchday 1', date: '2026-06-11', time: '13:00 UTC-6', team1: 'Mexico', team2: 'South Africa', group: 'Group A', ground: 'Mexico City', matchDate: toUTC('2026-06-11', '13:00 UTC-6') },
    { id: '2', round: 'Matchday 1', date: '2026-06-11', time: '20:00 UTC-6', team1: 'South Korea', team2: 'Czech Republic', group: 'Group A', ground: 'Guadalajara', matchDate: toUTC('2026-06-11', '20:00 UTC-6') },
    { id: '3', round: 'Matchday 2', date: '2026-06-12', time: '15:00 UTC-4', team1: 'Canada', team2: 'Bosnia & Herzegovina', group: 'Group B', ground: 'Toronto', matchDate: toUTC('2026-06-12', '15:00 UTC-4') },
    { id: '4', round: 'Matchday 3', date: '2026-06-13', time: '18:00 UTC-4', team1: 'Brazil', team2: 'Morocco', group: 'Group C', ground: 'New York/New Jersey', matchDate: toUTC('2026-06-13', '18:00 UTC-4') },
    { id: '5', round: 'Matchday 2', date: '2026-06-12', time: '18:00 UTC-7', team1: 'USA', team2: 'Paraguay', group: 'Group D', ground: 'Los Angeles', matchDate: toUTC('2026-06-12', '18:00 UTC-7') },
    { id: '6', round: 'Matchday 4', date: '2026-06-14', time: '12:00 UTC-5', team1: 'Germany', team2: 'Curaçao', group: 'Group E', ground: 'Houston', matchDate: toUTC('2026-06-14', '12:00 UTC-5') },
    { id: '7', round: 'Matchday 4', date: '2026-06-14', time: '15:00 UTC-5', team1: 'Netherlands', team2: 'Japan', group: 'Group F', ground: 'Dallas', matchDate: toUTC('2026-06-14', '15:00 UTC-5') },
    { id: '8', round: 'Matchday 5', date: '2026-06-15', time: '12:00 UTC-7', team1: 'Belgium', team2: 'Egypt', group: 'Group G', ground: 'Seattle', matchDate: toUTC('2026-06-15', '12:00 UTC-7') },
    { id: '9', round: 'Matchday 5', date: '2026-06-15', time: '12:00 UTC-4', team1: 'Spain', team2: 'Cape Verde', group: 'Group H', ground: 'Atlanta', matchDate: toUTC('2026-06-15', '12:00 UTC-4') },
    { id: '10', round: 'Matchday 6', date: '2026-06-16', time: '15:00 UTC-4', team1: 'France', team2: 'Senegal', group: 'Group I', ground: 'New York/New Jersey', matchDate: toUTC('2026-06-16', '15:00 UTC-4') },
    { id: '11', round: 'Matchday 6', date: '2026-06-16', time: '20:00 UTC-5', team1: 'Argentina', team2: 'Algeria', group: 'Group J', ground: 'Kansas City', matchDate: toUTC('2026-06-16', '20:00 UTC-5') },
    { id: '12', round: 'Matchday 7', date: '2026-06-17', time: '12:00 UTC-5', team1: 'Portugal', team2: 'DR Congo', group: 'Group K', ground: 'Houston', matchDate: toUTC('2026-06-17', '12:00 UTC-5') },
    { id: '13', round: 'Matchday 7', date: '2026-06-17', time: '15:00 UTC-5', team1: 'England', team2: 'Croatia', group: 'Group L', ground: 'Dallas', matchDate: toUTC('2026-06-17', '15:00 UTC-5') },
  ];
}

export function isGroupStage(match: Match): boolean {
  return match.round.startsWith('Matchday');
}

export function isKnockoutStage(match: Match): boolean {
  return !isGroupStage(match);
}
