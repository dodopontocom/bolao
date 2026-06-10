'use client';

import { useState, useEffect } from 'react';
import { FastForward, Rewind, RefreshCcw, Beaker } from 'lucide-react';
import { getNow, setSimulatedOffset } from '@/lib/services/matchService';
import { Match } from '@/data/matches';

export default function DevSimulator() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(getNow());
  const [offsetDays, setOffsetDays] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (process.env.NODE_ENV !== 'development') return;
    
    const interval = setInterval(() => {
      setNow(getNow());
    }, 1000);

    const saved = localStorage.getItem('devTimeOffset');
    if (saved) {
      setOffsetDays(Math.floor(parseInt(saved) / (1000 * 60 * 60 * 24)));
    }

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !mounted) return null;

  const handleAdjustDays = (days: number) => {
    const newOffset = days * 24 * 60 * 60 * 1000;
    setSimulatedOffset(newOffset);
    setOffsetDays(days);
    window.location.reload(); // Reload to apply changes everywhere
  };

  const simulateResults = async () => {
    try {
      const [matchesRes, resultsRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/results')
      ]);
      
      const matches: Match[] = await matchesRes.json();
      const results: Record<string, any> = await resultsRes.json();
      const currentNow = getNow();

      // Find matches that should have finished and DON'T have a result yet
      const pastMatchesWithoutResult = matches.filter(m => {
        const mDate = m.matchDate || new Date(m.date).getTime();
        const hasFinishedTime = currentNow > mDate + (120 * 60 * 1000);
        return hasFinishedTime && !results[m.id];
      });

      if (pastMatchesWithoutResult.length === 0) {
        alert('Não há novos jogos para simular resultados no momento.');
        return;
      }

      for (const match of pastMatchesWithoutResult) {
        // Random score simulation
        const s1 = Math.floor(Math.random() * 4);
        const s2 = Math.floor(Math.random() * 3);
        
        await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: match.id,
            homeGoals: s1,
            awayGoals: s2,
            finished: true
          })
        });
      }
      alert(`Simulados resultados para ${pastMatchesWithoutResult.length} novos jogos!`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Falha ao simular resultados');
    }
  };

  const resetAll = async () => {
    if (!confirm('Isso vai apagar TODOS os resultados, apostas e resetar o dinheiro de TODO MUNDO para N$ 10.000. Confirma?')) return;
    
    try {
      await fetch('/api/dev/reset', { method: 'POST' });
      setSimulatedOffset(0);
      localStorage.removeItem('devTimeOffset');
      window.location.reload();
    } catch (err) {
      alert('Falha ao resetar banco');
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2">
      <div className="bg-purple-600 text-white p-3 rounded-2xl shadow-2xl border-2 border-purple-400 flex flex-col gap-2 min-w-[150px]">
        <div className="flex items-center gap-2 border-b border-purple-400 pb-2 mb-1">
          <Beaker className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Lab Simulator</span>
        </div>
        
        <div className="text-[10px] opacity-80 flex flex-col">
          <span>Tempo Simulado:</span>
          <span className="font-mono">{new Date(now).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <button 
            onClick={() => handleAdjustDays(offsetDays - 1)}
            className="p-1 hover:bg-purple-500 rounded bg-purple-700"
          >
            <Rewind className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold">{offsetDays > 0 ? `+${offsetDays}` : offsetDays}d</span>
          <button 
            onClick={() => handleAdjustDays(offsetDays + 1)}
            className="p-1 hover:bg-purple-500 rounded bg-purple-700"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={simulateResults}
          className="text-[9px] bg-white text-purple-700 font-bold py-1 px-2 rounded hover:bg-purple-100 flex items-center justify-center gap-1"
        >
          <RefreshCcw className="w-3 h-3" />
          Gerar Resultados
        </button>
        
        <button 
          onClick={resetAll}
          className="text-[9px] text-white/60 hover:text-white underline"
        >
          Resetar Tudo (Banco + Tempo)
        </button>
      </div>
    </div>
  );
}
