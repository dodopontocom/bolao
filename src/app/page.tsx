'use client';

import { useApp } from '@/context/AppContext';
import LoginScreen from '@/components/LoginScreen';
import RoundTable from '@/components/RoundTable';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import { useState, useEffect } from 'react';
import { getMatchStatus } from '@/lib/services/matchService';

export default function Home() {
  const { 
    currentUser, users, matches, results, foods, chats, 
    loading, login, logout, refreshData, collectFood,
    activeTab, setActiveTab
  } = useApp();
  
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Spawn food logic (moved from original page.tsx to keep it functional)
  useEffect(() => {
    const userId = currentUser?._id;
    if (!userId) return;

    let timeoutId: NodeJS.Timeout;
    const spawnFood = () => {
      const delay = Math.floor(Math.random() * 10000) + 5000;
      timeoutId = setTimeout(async () => {
        try {
          await fetch('/api/food', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spawnedBy: userId }) 
          });
          refreshData();
        } catch (error) {
          console.error('Failed to spawn food:', error);
        } finally {
          spawnFood();
        }
      }, delay);
    };
    spawnFood();
    return () => clearTimeout(timeoutId);
  }, [currentUser?._id, refreshData]);

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

  const upcomingMatches = matches
    .filter((m) => {
      const status = getMatchStatus(m as any);
      return status !== 'finished';
    })
    .sort((a, b) => (a.matchDate || 0) - (b.matchDate || 0));

  const nextMatch = upcomingMatches[0] || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050816]">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={login} existingUsers={users} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050816]">
      <Header 
        onShowAdmin={() => setShowAdmin(true)} 
        onShowTutorial={() => setShowTutorial(true)} 
      />
      
      <main className="flex-1">
        <RoundTable
          currentUser={currentUser}
          users={users}
          matches={matches}
          nextMatch={nextMatch}
          results={results}
          foods={foods}
          chats={chats}
          onSendMessage={handleSendMessage}
          onCollectFood={collectFood}
          onLogout={logout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showAdmin={showAdmin}
          setShowAdmin={setShowAdmin}
          showTutorial={showTutorial}
          setShowTutorial={setShowTutorial}
        />
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
