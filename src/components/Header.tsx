'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Utensils, HelpCircle, Settings, LogOut, User, Home } from 'lucide-react';

interface HeaderProps {
  onShowAdmin?: () => void;
  onShowTutorial?: () => void;
}

export default function Header({ onShowAdmin, onShowTutorial }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useApp();

  if (!currentUser) return null;

  const handleAvatarClick = () => {
    if (pathname === '/profile') {
      router.push('/');
    } else {
      router.push('/profile');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#050816]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <button 
          onClick={handleAvatarClick}
          className="flex items-center gap-2 hover:bg-white/5 transition-colors p-1 -ml-1 rounded-lg"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-xl">
            {currentUser.avatar}
          </div>
          <div className="text-left">
            <p className="text-white font-medium text-sm">
              {currentUser.name}
              {currentUser.city && <span className="ml-2 text-[10px] text-white/40 font-normal">({currentUser.city})</span>}
            </p>
            <div className="flex items-center gap-3">
              <p className="text-yellow-400 text-xs font-bold">N${currentUser.balance.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-green-400">
                <Utensils className="w-3 h-3" />
                <span className="text-xs font-bold">{currentUser.foodPoints || 0}</span>
              </div>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Ir para a Mesa"
          >
            <Home className="w-4 h-4 text-white/30" />
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <User className="w-4 h-4 text-white/30" />
          </button>
          {onShowTutorial && (
            <button
              onClick={onShowTutorial}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Como funciona?"
            >
              <HelpCircle className="w-4 h-4 text-white/30" />
            </button>
          )}
          {onShowAdmin && (
            <button
              onClick={onShowAdmin}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4 text-white/30" />
            </button>
          )}
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4 text-white/30" />
          </button>
        </div>
      </div>
    </header>
  );
}
