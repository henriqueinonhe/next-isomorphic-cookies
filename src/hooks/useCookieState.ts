import { useState } from "react";
import { useCookie } from "./useCookie";
import { useSyncWithCookie } from "./useSyncWithCookie";

const useClientSideCookieState = <T>(
  key: string,
  initializer: (storedValue: T | undefined) => T
) => {
  const { retrieve, store, clear, needsSyncAfterHydration } = useCookie<T>(key);

  const [value, setValue] = useState<T>(() =>
    initializer(needsSyncAfterHydration ? undefined : retrieve())
  );

  useSyncWithCookie<T>(key, () => {
    boundRetrieve();
  });

  const boundRetrieve = () => {
    const storedValue = retrieve();
    setValue(storedValue ?? initializer(storedValue));
  };

  const boundStore = () => {
    store(value);
  };

  const boundClear = clear;

  return {
    value,
    setValue,
    retrieve: boundRetrieve,
    store: boundStore,
    clear: boundClear,
  };
};

const useServerSideCookieState = <T>(
  key: string,
  initializer: (storedValue: T | undefined) => T
) => {
  const { clear, retrieve } = useCookie<T>(key);

  const [value, setValue] = useState<T>(() => initializer(retrieve()));

  const boundRetrieve = () => {
    const storedValue = retrieve();
    setValue(storedValue ?? initializer(storedValue));
  };

  // No Op
  const boundStore = () => undefined;

  return {
    value,
    setValue,
    retrieve: boundRetrieve,
    store: boundStore,
    clear,
  };
};

export const useCookieState =
  typeof document !== undefined
    ? useClientSideCookieState
    : useServerSideCookieState;
