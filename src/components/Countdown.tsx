'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  matchDate: number; // UTC timestamp
}

export default function Countdown({ matchDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const closeTime = new Date(matchDate - 2 * 60 * 1000);

    const tick = () => {
      const now = Date.now();
      const diff = closeTime.getTime() - now;

      if (diff <= 0) {
        setTimeLeft('ENCERRADO');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hrs}h ${mins}m`);
      } else if (hrs > 0) {
        setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
      } else {
        setTimeLeft(`${mins}m ${secs}s`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [matchDate]);

  const isClosed = timeLeft === 'ENCERRADO';

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${isClosed ? 'text-red-400' : 'text-yellow-400'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
      {isClosed ? 'Palpites encerrados' : timeLeft}
    </div>
  );
}
