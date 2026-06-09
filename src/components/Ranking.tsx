'use client';

import { useState, useEffect } from 'react';
import { IUser } from '@/models/User';
import { IResult } from '@/models/Result';
import { Trophy } from 'lucide-react';
import { calculatePredictionPoints } from '@/lib/services/matchService';

interface RankingProps {
  users: IUser[];
  results: Record<string, IResult>;
  currentUserName: string;
}

type UserWithPoints = IUser & { predictionPoints: number };

export default function Ranking({ users, results, currentUserName }: RankingProps) {
  const [allPredictions, setAllPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/predictions')
      .then(res => res.json())
      .then(setAllPredictions)
      .finally(() => setLoading(false));
  }, []);

  const calculateUserPoints = (userId: string) => {
    let points = 0;
    const userPredictions = allPredictions.filter(p => 
      (p.userId?._id || p.userId) === userId
    );
    
    for (const prediction of userPredictions) {
      const result = results[prediction.matchId];
      if (!result || !result.finished) continue;
      points += calculatePredictionPoints(
        { homeGoals: prediction.homeGoals, awayGoals: prediction.awayGoals },
        result
      );
    }
    return points;
  };

  const usersWithPoints: UserWithPoints[] = users.map(user => ({
    ...user,
    predictionPoints: calculateUserPoints(user._id as string)
  }));

  const sortedUsers = [...usersWithPoints].sort((a, b) => {
    if (a.balance !== b.balance) return b.balance - a.balance;
    if (a.predictionPoints !== b.predictionPoints) return b.predictionPoints - a.predictionPoints;
    if (a.foodPoints !== b.foodPoints) return b.foodPoints - a.foodPoints;
    return a.name.localeCompare(b.name);
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (index === 1) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Trophy className="w-5 h-5 text-orange-600" />;
    return <span className="text-white/40 font-bold w-5 text-center">{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-white/10 rounded"></div>
              <div className="w-8 h-8 bg-white/10 rounded-full"></div>
              <div className="flex-1 h-4 bg-white/10 rounded w-1/2"></div>
              <div className="h-4 bg-white/10 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedUsers.map((user, index) => (
        <div
          key={user._id}
          className={`card p-3 flex items-center gap-3 ${user.name === currentUserName ? 'border-yellow-500/30 bg-yellow-500/5' : ''}`}
        >
          {getRankIcon(index)}
          <div className="text-2xl">{user.avatar}</div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">{user.name}</p>
            <p className="text-white/40 text-xs">
              {user.predictionPoints} pts palpites · +{user.foodPoints} pts comida
            </p>
          </div>
          <div className="text-right">
            <p className="text-yellow-400 font-bold">N${user.balance.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
