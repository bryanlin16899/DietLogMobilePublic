import React, { createContext, useContext, useState } from 'react';
import { DietLog, getDateHasIntakeInMonth, getDietLog } from '../services/api';
import { formatDate } from '../services/utils';

interface DietLogContextType {
  dietLog: DietLog | null;
  dateHasIntake: string[];
  loading: boolean;
  error: string | null;
  fetchDietLog: (date: Date, showLoading?: boolean) => Promise<void>;
  fetchDateHasIntakeInMonth: (year: number, month: number) => Promise<void>;
}

const DietLogContext = createContext<DietLogContextType | null>(null);

export function DietLogProvider({ children }: { children: React.ReactNode }) {
  const [dietLog, setDietLog] = useState<DietLog | null>(null);
  const [dateHasIntake, setDateHasIntake] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDietLog = async (date: Date, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const data = await getDietLog(formatDate(date));
      setDietLog(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch diet log');
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchDateHasIntakeInMonth = async (year: number, month: number) => {
    try {
      const data = await getDateHasIntakeInMonth(year, month);
      
      setDateHasIntake(data.dates);
      setError(null);
    } catch (err) {
      setError('Failed to fetch date has intake');
      console.error(err);
    }
  };

  return (
    <DietLogContext.Provider value={{ dietLog, dateHasIntake, loading, error, fetchDietLog, fetchDateHasIntakeInMonth }}>
      {children}
    </DietLogContext.Provider>
  );
}

export function useDietLog() {
  const context = useContext(DietLogContext);
  if (!context) {
    throw new Error('useDietLog must be used within a DietLogProvider');
  }
  return context;
}
