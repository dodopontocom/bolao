'use client';

import { Match } from '@/data/matches';

interface MatchListProps {
  matches: Match[];
  userName: string;
  results: any;
}

export default function MatchList({ matches, userName, results }: MatchListProps) {
  return (
    <div className="space-y-3">
      {matches.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          Nenhum jogo para exibir
        </div>
      ) : (
        matches.map((match) => (
          <div key={match.id} className="card p-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">{match.team1}</span>
              <span className="text-white/40 text-sm">vs</span>
              <span className="text-white text-sm">{match.team2}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
