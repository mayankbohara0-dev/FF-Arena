import { useState, useEffect, useRef } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  formatted: string; // e.g. "02:45:30" or "1d 02h"
}

export function useCountdown(targetTime: string | Date): CountdownResult {
  const getRemaining = (): CountdownResult => {
    const now = Date.now();
    const end = new Date(targetTime).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true, formatted: 'STARTED' };
    }

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    let formatted = '';
    if (days > 0) {
      formatted = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    } else if (hours > 0) {
      formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return { days, hours, minutes, seconds, expired: false, formatted };
  };

  const [countdown, setCountdown] = useState<CountdownResult>(getRemaining);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCountdown(getRemaining());
    intervalRef.current = setInterval(() => {
      const result = getRemaining();
      setCountdown(result);
      if (result.expired && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetTime]);

  return countdown;
}
