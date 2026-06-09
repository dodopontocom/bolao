'use client';

import { Match } from '@/data/matches';
import MatchCard from '@/components/MatchCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';

interface MatchListProps {
  matches: Match[];
  userName: string;
  userId: string;
  currentUser: any;
  results: any;
}

// Group matches by week starting on Monday
function groupMatchesByWeek(matches: Match[]) {
  const weeks: { [key: string]: Match[] } = {};
  const sortedMatches = [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  sortedMatches.forEach(match => {
    const date = new Date(match.date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const weekStart = new Date(date.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = weekStart.toISOString().split('T')[0];
    if (!weeks[weekKey]) weeks[weekKey] = [];
    weeks[weekKey].push(match);
  });
  
  return Object.keys(weeks).sort().map(key => ({
    weekStart: new Date(key),
    matches: weeks[key]
  }));
}

function formatWeekLabel(date: Date) {
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const startStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const endStr = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${startStr} - ${endStr}`;
}

export default function MatchList({ matches, userName, userId, currentUser, results }: MatchListProps) {
  const weeks = useMemo(() => groupMatchesByWeek(matches), [matches]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  const currentWeek = weeks[currentWeekIndex];

  return (
    <div className="space-y-3">
      {weeks.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          Nenhum jogo para exibir
        </div>
      ) : (
        <>
          {/* Week Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentWeekIndex(i => Math.max(0, i - 1))}
              disabled={currentWeekIndex === 0}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <span className="text-white font-semibold flex-1 text-center">
              {currentWeek && formatWeekLabel(currentWeek.weekStart)}
            </span>
            <button
              onClick={() => setCurrentWeekIndex(i => Math.min(weeks.length - 1, i + 1))}
              disabled={currentWeekIndex === weeks.length - 1}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Matches */}
          <div className="space-y-3">
            {currentWeek?.matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                userName={userName}
                userId={userId}
                currentUser={currentUser}
                result={results[match.id] || null}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
