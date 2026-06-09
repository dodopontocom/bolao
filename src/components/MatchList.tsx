import { Match, isGroupStage } from '../data/matches';
import { MatchResult } from '../data/storage';
import MatchCard from './MatchCard';

interface MatchListProps {
  matches: Match[];
  userName: string;
  results: Record<string, MatchResult>;
}

export default function MatchList({ matches, userName, results }: MatchListProps) {
  const groupMatches = matches.filter(isGroupStage);
  const groups = [...new Set(groupMatches.map((m) => m.group).filter(Boolean))].sort() as string[];

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const groupMatchesForGroup = groupMatches.filter((m) => m.group === group);
        return (
          <div key={group}>
            <h3 className="font-display text-sm font-bold text-gold-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gold-400/50 rounded" />
              {group}
            </h3>
            <div className="space-y-3">
              {groupMatchesForGroup.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  userName={userName}
                  result={results[match.id] || null}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
