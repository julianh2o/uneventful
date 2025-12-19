import { useState, useEffect } from 'react';

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
}

const parseEventDate = (dateStr?: string, timeStr?: string): Date | null => {
  if (!dateStr) return null;
  try {
    const [month, day, year] = dateStr.split('/').map(Number);
    let hours = 0;
    let minutes = 0;
    if (timeStr) {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        if (match[3]?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (match[3]?.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
    }
    return new Date(year, month - 1, day, hours, minutes);
  } catch {
    return null;
  }
};

const calculateCountdown = (targetDate: Date | null): CountdownTime => {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };

  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    passed: false,
  };
};

export const useEventCountdown = (eventDate?: string, eventTime?: string): CountdownTime => {
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    passed: true,
  });

  useEffect(() => {
    const parsedDate = parseEventDate(eventDate, eventTime);

    const updateCountdown = () => {
      setCountdown(calculateCountdown(parsedDate));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [eventDate, eventTime]);

  return countdown;
};
