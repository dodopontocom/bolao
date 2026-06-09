'use client';

import { useState, useEffect, useCallback } from 'react';
import LoginScreen from '@/components/LoginScreen';
import RoundTable from '@/components/RoundTable';
import { IUser } from '@/models/User';
import { Match } from '@/data/matches';
import { IResult } from '@/models/Result';
import { IFood } from '@/models/Food';
import { IChat } from '@/models/Chat';
import { getMatchStatus } from '@/lib/services/matchService';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<Record<string, IResult>>({});
  const [foods, setFoods] = useState<IFood[]>([]);
  const [chats, setChats] = useState<IChat[]>([]);
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
      const [usersRes, matchesRes, resultsRes, foodsRes, chatsRes] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }),
        fetch('/api/matches', { cache: 'no-store' }),
        fetch('/api/results', { cache: 'no-store' }),
        fetch('/api/food', { cache: 'no-store' }),
        fetch('/api/chat', { cache: 'no-store' }),
      ]);
      const usersData = await usersRes.json();
      const matchesData = await matchesRes.json();
      const resultsData = await resultsRes.json();
      const foodsData = await foodsRes.json();
      const chatsData = await chatsRes.json();

      setUsers(usersData);
      setMatches(matchesData);
      setResults(resultsData);
      setFoods(foodsData);
      setChats(chatsData);

      if (currentUser) {
        const updatedSelf = usersData.find((u: IUser) => u._id === currentUser._id);
        if (updatedSelf && (
          updatedSelf.balance !== currentUser.balance || 
          updatedSelf.foodPoints !== currentUser.foodPoints ||
          updatedSelf.lastClaimedMatchId !== currentUser.lastClaimedMatchId
        )) {
          setCurrentUser(updatedSelf);
        }
        await fetch(`/api/users/${currentUser._id}/ping`, { method: 'POST' });
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshData();
      const interval = setInterval(refreshData, 3000);
      return () => clearInterval(interval);
    }
  }, [currentUser?._id, refreshData]);

  // Spawn food randomly - Scales with online users
  useEffect(() => {
    const userId = currentUser?._id;
    if (!userId) return;

    console.log('Food spawn system initialized');
    let timeoutId: NodeJS.Timeout;
    
    const spawnFood = () => {
      // Get current online count from the state at the time of execution
      // Use a shorter base time for testing and better UX
      const delay = Math.floor(Math.random() * 10000) + 5000; // 5-15 seconds random

      timeoutId = setTimeout(async () => {
        try {
          const res = await fetch('/api/food', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spawnedBy: userId }) 
          });
          if (res.ok) {
            const newFood = await res.json();
            setFoods(prev => [...prev, newFood]);
          }
        } catch (error) {
          console.error('Failed to spawn food:', error);
        } finally {
          spawnFood();
        }
      }, delay);
    };
    
    spawnFood();
    return () => clearTimeout(timeoutId);
  }, [currentUser?._id]); // Only reset if user changes/logouts

  const handleSendMessage = async (message: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          userName: currentUser.name,
          message,
        }),
      });
      refreshData();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

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
        chats={chats}
        onSendMessage={handleSendMessage}
        onCollectFood={handleCollectFood}
        onLogout={handleLogout}
      />
    </div>
  );
}
