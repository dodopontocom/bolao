'use client';

import { useRouter, usePathname } from 'next/navigation';
import { List, BarChart3 } from 'lucide-react';

interface NavigationProps {
  activeTab: 'table' | 'matches' | 'ranking';
  setActiveTab: (tab: 'table' | 'matches' | 'ranking') => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabClick = (tab: 'table' | 'matches' | 'ranking') => {
    if (pathname !== '/') {
      router.push('/');
      // We might need a small delay or use a global state to set the tab after navigation
      // For now, let's assume it only works fully on the home page
    }
    setActiveTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#050816]/95 backdrop-blur-md border-t border-white/10">
      <div className="max-w-lg mx-auto flex">
        <button
          onClick={() => handleTabClick('table')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all duration-200 ${activeTab === 'table' && pathname === '/' ? 'text-yellow-400' : 'text-white/40 hover:text-white/60'}`}
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-green-700"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Mesa</span>
          {activeTab === 'table' && pathname === '/' && <div className="w-1 h-1 rounded-full bg-yellow-400 mt-0.5"></div>}
        </button>
        <button
          onClick={() => handleTabClick('matches')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all duration-200 ${activeTab === 'matches' && pathname === '/' ? 'text-yellow-400' : 'text-white/40 hover:text-white/60'}`}
        >
          <List className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Jogos</span>
          {activeTab === 'matches' && pathname === '/' && <div className="w-1 h-1 rounded-full bg-yellow-400 mt-0.5"></div>}
        </button>
        <button
          onClick={() => handleTabClick('ranking')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-all duration-200 ${activeTab === 'ranking' && pathname === '/' ? 'text-yellow-400' : 'text-white/40 hover:text-white/60'}`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Ranking</span>
          {activeTab === 'ranking' && pathname === '/' && <div className="w-1 h-1 rounded-full bg-yellow-400 mt-0.5"></div>}
        </button>
      </div>
    </nav>
  );
}
