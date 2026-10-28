import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'customHolidays.v1';

export type CustomHolidays = Record<string, string>;

export function useCustomHolidays() {
  const [custom, setCustom] = useState<CustomHolidays>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setCustom(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((next: CustomHolidays) => {
    setCustom(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const add = useCallback(
    (iso: string, name: string) => persist({ ...custom, [iso]: name.trim() || 'วันหยุดของฉัน' }),
    [custom, persist],
  );

  const remove = useCallback(
    (iso: string) => {
      const { [iso]: _, ...rest } = custom;
      persist(rest);
    },
    [custom, persist],
  );

  return { custom, loaded, add, remove };
}
