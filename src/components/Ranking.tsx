import { UserScore } from '../data/storage';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal } from 'lucide-react';

interface RankingProps {
  scores: UserScore[];
  currentUser: string;
}

function getRankStyle(rank: number) {
  switch (rank) {
    case 1: return 'bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950';
    case 2: return 'bg-gradient-to-r from-gray-300 to-gray-400 text-navy-950';
    case 3: return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
    default: return 'bg-white/10 text-white';
  }
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1: return <Trophy className="w-4 h-4" />;
    case 2: return <Medal className="w-4 h-4" />;
    case 3: return <Medal className="w-4 h-4" />;
    default: return null;
  }
}

function getMovementIcon(prevRank: number | undefined, currentRank: number) {
  if (prevRank === undefined) return <Minus className="w-3 h-3 text-white/30" />;
  if (prevRank < currentRank) return <TrendingDown className="w-3 h-3 text-red-400" />;
  if (prevRank > currentRank) return <TrendingUp className="w-3 h-3 text-pitch-400" />;
  return <Minus className="w-3 h-3 text-white/30" />;
}

export default function Ranking({ scores, currentUser }: RankingProps) {
  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/40">
        <Trophy className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Nenhum palpite computado ainda</p>
        <p className="text-xs mt-1">Faca palpites e aguarde os resultados!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {scores.map((user) => {
        const isMe = user.userName === currentUser;
        return (
          <div
            key={user.userName}
            className={`card p-4 flex items-center gap-3 animate-slide-up ${isMe ? 'border-gold-500/30 bg-gold-500/5' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 ${getRankStyle(user.rank)}`}>
              {getRankIcon(user.rank) || user.rank}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold truncate ${isMe ? 'text-gold-400' : 'text-white'}`}>
                  {user.userName}
                </span>
                {isMe && (
                  <span className="text-[10px] font-bold text-gold-400 bg-gold-400/10 px-1.5 py-0.5 rounded-full uppercase">
                    Voce
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                <span>{user.exactHits} exatos</span>
                <span className="text-white/20">|</span>
                <span>{user.winnerHits} vencedores</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {getMovementIcon(user.prevRank, user.rank)}
              <div className="text-right">
                <span className="font-display font-bold text-xl text-white">{user.points}</span>
                <span className="text-xs text-white/40 ml-1">pts</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
