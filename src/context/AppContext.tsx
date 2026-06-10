'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { IUser } from '@/models/User';
import { Match } from '@/data/matches';
import { IResult } from '@/models/Result';
import { IFood } from '@/models/Food';
import { IChat } from '@/models/Chat';
import { getMatchStatus } from '@/lib/services/matchService';

interface AppContextType {
  currentUser: IUser | null;
  users: IUser[];
  matches: Match[];
  results: Record<string, IResult>;
  foods: IFood[];
  chats: IChat[];
  loading: boolean;
  activeTab: 'table' | 'matches' | 'ranking';
  setActiveTab: (tab: 'table' | 'matches' | 'ranking') => void;
  refreshData: () => Promise<void>;
  login: (user: IUser) => void;
  logout: () => void;
  collectFood: (foodId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [results, setResults] = useState<Record<string, IResult>>({});
  const [foods, setFoods] = useState<IFood[]>([]);
  const [chats, setChats] = useState<IChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'table' | 'matches' | 'ranking'>('table');

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
        if (updatedSelf) {
          setCurrentUser(updatedSelf);
        }
        await fetch(`/api/users/${currentUser._id}/ping`, { method: 'POST' });
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [currentUser?._id]);

  useEffect(() => {
    let mounted = true;
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (!mounted) return;
          const user = data.find((u: IUser) => u._id === savedUserId);
          if (user) {
            setCurrentUser(user);
          }
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshData();
      const interval = setInterval(() => {
        refreshData();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser?._id, refreshData]);

  const login = (user: IUser) => {
    setCurrentUser(user);
    localStorage.setItem('userId', user._id);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('userId');
  };

  const collectFood = async (foodId: string) => {
    if (!currentUser) return;
    try {
      await fetch(`/api/food/${foodId}/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser._id }),
      });
      setFoods(prev => prev.filter(f => f._id !== foodId));
      refreshData();
    } catch (error) {
      console.error('Failed to collect food:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, matches, results, foods, chats, loading,
      activeTab, setActiveTab,
      refreshData, login, logout, collectFood
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
