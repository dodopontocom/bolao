'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Match } from '@/data/matches';

interface AdminPanelProps {
  matches?: Match[];
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [adminPin, setAdminPin] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeGoals, setHomeGoals] = useState('0');
  const [awayGoals, setAwayGoals] = useState('0');
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch('/api/matches').then(res => res.json()).then(data => {
      setAllMatches(data);
      if (data.length > 0) {
        setSelectedMatch(data[0]);
      }
    });
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '456') {
      setAuthenticated(true);
    }
  };

  const handleSaveResult = async () => {
    if (!selectedMatch) return;
    try {
      await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPin: '456',
          matchId: selectedMatch.id,
          homeGoals: parseInt(homeGoals),
          awayGoals: parseInt(awayGoals),
          finished,
        }),
      });
      onClose();
    } catch (err) {
      console.error('Failed to save result:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4">
      <div className="bg-[#050816] rounded-t-2xl sm:rounded-2xl w-full max-w-md border border-white/10 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#050816] p-4 flex items-center justify-between border-b border-white/10">
          <h2 className="text-white font-bold text-lg">Painel Admin</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!authenticated ? (
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2 text-sm">PIN Admin</label>
                <input
                  type="text"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                  placeholder="Digite o PIN"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl"
              >
                Entrar
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2 text-sm">Selecionar Jogo</label>
                <select
                  value={selectedMatch?.id || ''}
                  onChange={(e) => setSelectedMatch(allMatches.find(m => m.id === e.target.value) || null)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                >
                  {allMatches.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.team1} vs {m.team2}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatch && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-white/60 text-xs mb-1">{selectedMatch.team1}</label>
                      <input
                        type="number"
                        value={homeGoals}
                        onChange={(e) => setHomeGoals(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl"
                      />
                    </div>
                    <span className="text-white/40 font-bold">x</span>
                    <div className="flex-1">
                      <label className="block text-white/60 text-xs mb-1">{selectedMatch.team2}</label>
                      <input
                        type="number"
                        value={awayGoals}
                        onChange={(e) => setAwayGoals(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={finished}
                      onChange={(e) => setFinished(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Jogo finalizado
                  </label>

                  <button
                    onClick={handleSaveResult}
                    className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl"
                  >
                    Salvar Resultado
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
