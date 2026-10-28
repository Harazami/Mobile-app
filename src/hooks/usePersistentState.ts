import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/** useState ที่บันทึกลงเครื่องด้วย AsyncStorage (JSON) */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) setValue(JSON.parse(raw));
      })
      .catch(() => {});
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        AsyncStorage.setItem(key, JSON.stringify(v)).catch(() => {});
        return v;
      });
    },
    [key],
  );

  return [value, update] as const;
}
