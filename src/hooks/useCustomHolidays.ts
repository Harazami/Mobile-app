import { useCallback } from 'react';
import { DateRange, expandRange } from '../lib/ranges';
import { usePersistentState } from './usePersistentState';

export type CustomHolidays = Record<string, string>;

export function useCustomHolidays() {
  const [custom, setCustom] = usePersistentState<CustomHolidays>('customHolidays.v1', {});

  const addRange = useCallback(
    (range: DateRange, name: string) => {
      const label = name.trim() || 'วันหยุดของฉัน';
      setCustom((prev) => {
        const next = { ...prev };
        for (const iso of expandRange(range)) next[iso] = label;
        return next;
      });
    },
    [setCustom],
  );

  const removeDays = useCallback(
    (days: string[]) => {
      setCustom((prev) => {
        const next = { ...prev };
        for (const iso of days) delete next[iso];
        return next;
      });
    },
    [setCustom],
  );

  return { custom, addRange, removeDays };
}
