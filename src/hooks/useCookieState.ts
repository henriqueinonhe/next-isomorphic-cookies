import { useState } from "react";
import { CookieAttributes } from "../cookies/Cookies";
import { UseCookie } from "./useCookie";
import { UseSyncWithCookie } from "./useSyncWithCookie";

type UseClientSideCookieStateDependencies = {
  useCookie: UseCookie;
  useSyncWithCookie: UseSyncWithCookie;
};

export const makeUseClientSideCookieState =
  ({ useCookie, useSyncWithCookie }: UseClientSideCookieStateDependencies) =>
  <T>(key: string, initializer: (storedValue: T | undefined) => T) => {
    const { retrieve, store, clear, needsSync } = useCookie<T>(key);

    const [value, setValue] = useState<T>(() =>
      initializer(needsSync ? undefined : retrieve())
    );

    useSyncWithCookie<T>(key, () => {
      boundRetrieve();
    });

    const boundRetrieve = () => {
      const storedValue = retrieve();
      setValue(storedValue ?? initializer(storedValue));
    };

    const boundStore = (attributes?: CookieAttributes) => {
      store(value, attributes);
    };

    const boundClear = (attributes?: CookieAttributes) => {
      clear(attributes);
      setValue(initializer(undefined));
    };

    return {
      value,
      setValue,
      retrieve: boundRetrieve,
      store: boundStore,
      clear: boundClear,
    };
  };

type UseServerSideCookieStateDependencies = {
  useCookie: UseCookie;
};

export const makeUseServerSideCookieState =
  ({ useCookie }: UseServerSideCookieStateDependencies) =>
  <T>(key: string, initializer: (storedValue: T | undefined) => T) => {
    const { retrieve } = useCookie<T>(key);

    const [value, setValue] = useState<T>(() => initializer(retrieve()));

    const boundRetrieve = () => {
      const storedValue = retrieve();
      setValue(storedValue ?? initializer(storedValue));
    };

    // No Op
    const boundStore = () => undefined;

    const boundClear = () => {
      setValue(initializer(undefined));
    };

    return {
      value,
      setValue,
      retrieve: boundRetrieve,
      store: boundStore,
      clear: boundClear,
    };
  };
