'use client';

import { useState, useEffect } from 'react';
import { IUser } from '@/models/User';
import { IResult } from '@/models/Result';
import { Trophy } from 'lucide-react';
import Prediction from '@/models/Prediction';

interface RankingProps {
  users: IUser[];
  results: Record<string, IResult>;
  currentUserName: string;
}

type UserWithPoints = IUser & { predictionPoints: number };

export default function Ranking({ users, results, currentUserName }: RankingProps) {
  const [allPredictions, setAllPredictions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/predictions').then(res => res.json()).then(setAllPredictions);
  }, []);

  const calculatePredictionPoints = (userId: string) => {
    let points = 0;
    const userPredictions = allPredictions.filter(p => 
      (p.userId?._id || p.userId) === userId
    );
    
    for (const prediction of userPredictions) {
      const result = results[prediction.matchId];
      if (!result || !result.finished) continue;

      const predWinner = prediction.homeGoals > prediction.awayGoals ? 'home' : 
                          prediction.homeGoals < prediction.awayGoals ? 'away' : 'draw';
      const actualWinner = result.homeGoals > result.awayGoals ? 'home' :
                            result.homeGoals < result.awayGoals ? 'away' : 'draw';

      if (prediction.homeGoals === result.homeGoals && prediction.awayGoals === result.awayGoals) {
        points += 3;
      } else if (predWinner === actualWinner) {
        points += 1;
      }
    }
    return points;
  };

  const usersWithPoints: UserWithPoints[] = users.map(user => ({
    ...user,
    predictionPoints: calculatePredictionPoints(user._id as string)
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
            <p className="text-yellow-400 font-bold">R${user.balance.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
