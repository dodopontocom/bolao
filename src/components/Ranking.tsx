'use client';

import { IUser } from '@/models/User';
import { IResult } from '@/models/Result';
import { Trophy, TrendingUp } from 'lucide-react';

interface RankingProps {
  users: IUser[];
  results: Record<string, IResult>;
  currentUserName: string;
}

export default function Ranking({ users, currentUserName }: RankingProps) {
  // Sort primarily by balance
  const sortedUsers = [...users].sort((a, b) => {
    if (b.balance !== a.balance) return b.balance - a.balance;
    if (b.foodPoints !== a.foodPoints) return b.foodPoints - a.foodPoints;
    return a.name.localeCompare(b.name);
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Trophy className="w-5 h-5 text-orange-600" />;
    return <span className="text-white/40 font-bold w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-yellow-400" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Top Mais Ricos</h3>
        </div>
        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">vs Os Mais Fominhas</span>
      </div>

      {sortedUsers.map((user, index) => (
        <div
          key={user._id}
          className={`card p-3 flex items-center gap-3 transition-all ${user.name === currentUserName ? 'border-yellow-500/50 bg-yellow-500/10 scale-[1.02] z-10 shadow-lg shadow-yellow-500/5' : ''}`}
        >
          {getRankIcon(index)}
          <div className="text-2xl">{user.avatar}</div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm flex items-center gap-2">
              {user.name}
              {user.name === currentUserName && <span className="text-[10px] bg-yellow-500 text-black px-1.5 rounded-full font-bold uppercase">Você</span>}
            </p>
            <p className="text-white/40 text-[10px] uppercase font-bold tracking-tighter">
              Fominha Level: {user.foodPoints}
            </p>
          </div>
          <div className="text-right">
            <p className="text-yellow-400 font-bold text-lg">N${user.balance.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
