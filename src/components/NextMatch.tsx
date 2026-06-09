import { Match, getMatchStatus } from '../data/matches';
import { MatchResult, loadPrediction } from '../data/storage';
import { getFlag } from '../data/flags';
import Countdown from './Countdown';
import { Star, Zap } from 'lucide-react';

interface NextMatchProps {
  match: Match;
  userName: string;
  result?: MatchResult | null;
}

export default function NextMatch({ match, userName, result }: NextMatchProps) {
  const status = getMatchStatus(match);
  const isFinished = status === 'finished' || !!result;
  const isClosed = status === 'closed' || isFinished;
  const pred = loadPrediction(match.id, userName);

  return (
    <div className="card border-gold-500/30 shadow-lg shadow-gold-500/5 overflow-hidden">
      <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gold-400 text-xs font-bold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" />
          Proximo Jogo
        </div>
        {!isClosed && !isFinished && (
          <Countdown targetDate={match.date} matchTime={match.time} />
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          {match.group && (
            <span className="text-xs font-bold text-gold-400 uppercase tracking-wider">
              {match.group}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <span className="text-5xl">{getFlag(match.team1)}</span>
            <span className="font-display font-bold text-base text-center">{match.team1}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            {isFinished && result ? (
              <div className="flex items-center gap-2">
                <span className="text-5xl font-display font-bold text-white">{result.score1}</span>
                <span className="text-2xl font-display text-white/20">x</span>
                <span className="text-5xl font-display font-bold text-white">{result.score2}</span>
              </div>
            ) : isClosed ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-display font-bold text-white/30">{pred?.score1 ?? '-'}</span>
                  <span className="text-xl font-display text-white/20">x</span>
                  <span className="text-4xl font-display font-bold text-white/30">{pred?.score2 ?? '-'}</span>
                </div>
                <span className="text-[10px] text-white/30 mt-1">seu palpite</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {pred ? (
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-display font-bold text-pitch-400">{pred.score1}</span>
                    <span className="text-xl font-display text-white/20">x</span>
                    <span className="text-4xl font-display font-bold text-pitch-400">{pred.score2}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-white/20">
                    <Star className="w-5 h-5" />
                    <span className="text-sm">Faca seu palpite abaixo</span>
                    <Star className="w-5 h-5" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            <span className="text-5xl">{getFlag(match.team2)}</span>
            <span className="font-display font-bold text-base text-center">{match.team2}</span>
          </div>
        </div>

        <div className="text-center text-xs text-white/30 mt-3">
          {match.ground} &middot; {match.date} &middot; {match.time}
        </div>
      </div>
    </div>
  );
}
