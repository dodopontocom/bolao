import { useState } from 'react';
import { Shield, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Match } from '../data/matches';
import { getFlag } from '../data/flags';
import { saveResult, loadResult } from '../data/storage';

interface AdminPanelProps {
  matches: Match[];
  onClose: () => void;
}

export default function AdminPanel({ matches, onClose }: AdminPanelProps) {
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [score1, setScore1] = useState<string>('');
  const [score2, setScore2] = useState<string>('');
  const [saved, setSaved] = useState(false);
  const [showMatchList, setShowMatchList] = useState(false);

  const groupMatches = matches.filter((m) => m.group);
  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  const handleSelectMatch = (id: string) => {
    setSelectedMatchId(id);
    setShowMatchList(false);
    setSaved(false);
    const existing = loadResult(id);
    if (existing) {
      setScore1(existing.score1.toString());
      setScore2(existing.score2.toString());
    } else {
      setScore1('');
      setScore2('');
    }
  };

  const handleSaveResult = () => {
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    if (isNaN(s1) || isNaN(s2) || !selectedMatchId) return;

    saveResult({ matchId: selectedMatchId, score1: s1, score2: s2 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/95 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="max-w-lg mx-auto p-4 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold-400" />
            <h2 className="font-display text-xl font-bold text-white">Painel Admin</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <p className="text-white/40 text-sm mb-6">
          Insira o resultado real de um jogo para recalcular o ranking automaticamente.
        </p>

        <div className="card p-4 mb-4">
          <label className="block text-white/70 text-sm font-medium mb-2">Selecionar Jogo</label>
          <button
            onClick={() => setShowMatchList(!showMatchList)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white transition-colors hover:bg-white/15"
          >
            <span className={selectedMatch ? 'text-white' : 'text-white/30'}>
              {selectedMatch
                ? `${getFlag(selectedMatch.team1)} ${selectedMatch.team1} vs ${selectedMatch.team2} ${getFlag(selectedMatch.team2)}`
                : 'Escolha um jogo...'}
            </span>
            {showMatchList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMatchList && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-navy-900 border border-white/10 divide-y divide-white/5 scrollbar-hide">
              {groupMatches.map((m) => {
                const existing = loadResult(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMatch(m.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors
                      ${selectedMatchId === m.id ? 'bg-white/10' : ''}`}
                  >
                    <span className="text-sm">
                      {getFlag(m.team1)} {m.team1} vs {m.team2} {getFlag(m.team2)}
                    </span>
                    <span className="text-xs text-white/30 shrink-0 ml-2">
                      {m.date}
                      {existing && ` (${existing.score1}x${existing.score2})`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedMatch && (
          <div className="card p-4 mb-4 animate-scale-in">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">{getFlag(selectedMatch.team1)}</span>
                <span className="text-xs text-white/60">{selectedMatch.team1}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={score1}
                  onChange={(e) => { setScore1(e.target.value); setSaved(false); }}
                  className="score-input"
                  placeholder="-"
                />
                <span className="text-xl font-display text-white/20">x</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={score2}
                  onChange={(e) => { setScore2(e.target.value); setSaved(false); }}
                  className="score-input"
                  placeholder="-"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">{getFlag(selectedMatch.team2)}</span>
                <span className="text-xs text-white/60">{selectedMatch.team2}</span>
              </div>
            </div>

            <button
              onClick={handleSaveResult}
              disabled={score1 === '' || score2 === '' || saved}
              className={`w-full py-3.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200
                ${saved
                  ? 'bg-pitch-500/20 text-pitch-400 border border-pitch-500/30'
                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 active:scale-[0.98]'
                }`}
            >
              {saved ? (
                <>Resultado Salvo!</>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Confirmar Resultado
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-display text-sm font-bold text-white/50 uppercase tracking-wider mb-3">
            Resultados Registrados
          </h3>
          <div className="space-y-2">
            {groupMatches
              .filter((m) => loadResult(m.id))
              .map((m) => {
                const r = loadResult(m.id)!;
                return (
                  <div key={m.id} className="card p-3 flex items-center justify-between">
                    <span className="text-sm">
                      {getFlag(m.team1)} {m.team1} <span className="font-display font-bold">{r.score1}</span>
                      <span className="text-white/20 mx-1">x</span>
                      <span className="font-display font-bold">{r.score2}</span> {m.team2} {getFlag(m.team2)}
                    </span>
                    <span className="text-xs text-white/30">{m.group}</span>
                  </div>
                );
              })}
            {groupMatches.filter((m) => loadResult(m.id)).length === 0 && (
              <p className="text-white/20 text-sm text-center py-4">Nenhum resultado registrado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
