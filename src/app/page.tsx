'use client';

import { useState, useEffect, useCallback } from 'react';
import LoginScreen from '@/components/LoginScreen';
import RoundTable from '@/components/RoundTable';
import { IUser } from '@/models/User';
import { Match } from '@/data/matches';
import { IResult } from '@/models/Result';
import { IFood } from '@/models/Food';
import { getMatchStatus } from '@/lib/services/matchService';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<Record<string, IResult>>({});
  const [foods, setFoods] = useState<IFood[]>([]);
  const [loading, setLoading] = useState(true);

  // Check local storage for existing user
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      fetch(`/api/users`)
        .then(res => res.json())
        .then(data => {
          const user = data.find((u: IUser) => u._id === savedUserId);
          if (user) {
            setCurrentUser(user);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch data regularly
  const refreshData = useCallback(async () => {
    try {
      const [usersRes, matchesRes, resultsRes, foodsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/matches'),
        fetch('/api/results'),
        fetch('/api/food'),
      ]);
      setUsers(await usersRes.json());
      setMatches(await matchesRes.json());
      setResults(await resultsRes.json());
      setFoods(await foodsRes.json());

      if (currentUser) {
        await fetch(`/api/users/${currentUser._id}/ping`, { method: 'POST' });
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshData();
      const interval = setInterval(refreshData, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshData]);

  // Spawn food randomly
  useEffect(() => {
    if (currentUser) {
      const spawnFood = () => {
        fetch('/api/food', { method: 'POST' })
          .then(res => res.json())
          .then(newFood => {
            setFoods(prev => [...prev, newFood]);
          })
          .catch(console.error);
      };
      
      const interval = setInterval(spawnFood, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLogin = (user: IUser) => {
    setCurrentUser(user);
    localStorage.setItem('userId', user._id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('userId');
  };

  const handleCollectFood = async (foodId: string) => {
    if (!currentUser) return;
    
    try {
      await fetch(`/api/food/${foodId}/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser._id }),
      });
      setFoods(prev => prev.filter(f => f._id !== foodId));
      setCurrentUser(prev => prev ? { ...prev, foodPoints: prev.foodPoints + 1 } : null);
    } catch (error) {
      console.error('Failed to collect food:', error);
    }
  };

  const upcomingMatches = matches
    .filter((m) => m.group && getMatchStatus(m as any) !== 'finished')
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

  const nextMatch = upcomingMatches[0] || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} existingUsers={users} />;
  }

  return (
    <div className="min-h-screen bg-[#050816]">
      <RoundTable
        currentUser={currentUser}
        users={users}
        matches={matches}
        nextMatch={nextMatch}
        results={results}
        foods={foods}
        onCollectFood={handleCollectFood}
        onLogout={handleLogout}
      />
    </div>
  );
}
