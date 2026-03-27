import { useState, useEffect, useCallback } from 'react';

/**
 * Countdown hook that counts down to a target date.
 * SSR-safe: returns null values on first render, hydrates on client.
 *
 * @param {Date|null} [targetDate] - Target date. If null/undefined, counts to midnight (end of day).
 * @returns {{ days: string, hours: string, minutes: string, seconds: string, isExpired: boolean, raw: number|null }}
 */
export default function useCountdown(targetDate) {
  const getTarget = useCallback(() => {
    if (targetDate instanceof Date) return targetDate;
    // Default: midnight tonight
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return midnight;
  }, [targetDate]);

  const getSecondsLeft = useCallback(() => {
    const target = getTarget();
    return Math.max(0, Math.floor((target - new Date()) / 1000));
  }, [getTarget]);

  // Start with null to avoid SSR/client mismatch
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    setSecondsLeft(getSecondsLeft());
    const timer = setInterval(() => {
      const remaining = getSecondsLeft();
      setSecondsLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [getSecondsLeft]);

  // SSR / first render placeholder
  if (secondsLeft === null) {
    return {
      days: '--',
      hours: '--',
      minutes: '--',
      seconds: '--',
      isExpired: false,
      raw: null,
    };
  }

  const days = String(Math.floor(secondsLeft / 86400)).padStart(2, '0');
  const hours = String(Math.floor((secondsLeft % 86400) / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: secondsLeft <= 0,
    raw: secondsLeft,
  };
}
