// src/context/TimeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

interface TimeContextType {
  now: Date;
  hour: number;
  minute: number;
  isMorning: boolean; // 6–12
  isAfternoon: boolean; // 12–18
  isEvening: boolean; // 18–22
  isNight: boolean; // 22–6
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export const TimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000); // update every minute

    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const minute = now.getMinutes();

  return (
    <TimeContext.Provider
      value={{
        now,
        hour,
        minute,
        isMorning: hour >= 6 && hour < 12,
        isAfternoon: hour >= 12 && hour < 18,
        isEvening: hour >= 18 && hour < 22,
        isNight: hour >= 22 || hour < 6,
      }}
    >
      {children}
    </TimeContext.Provider>
  );
};

export const useTime = () => {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
};