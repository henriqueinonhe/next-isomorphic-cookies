import { useState } from "react";
import { CookieAttributes } from "../cookies/Cookies";
import { identity } from "../utils/identity";
import { UseCookie } from "./useCookie";
import { UseSyncWithCookie } from "./useSyncWithCookie";

type UseCookieStateOptions<T> = {
  autoStore?: AutoStore<T>;
};

type AutoStore<T> =
  | true
  | false
  | {
      attributes?: CookieAttributes;
      serializer?: (value: T) => T;
    };

type UseClientSideCookieStateDependencies = {
  useCookie: UseCookie;
  useSyncWithCookie: UseSyncWithCookie;
};

export const makeUseClientSideCookieState =
  ({ useCookie, useSyncWithCookie }: UseClientSideCookieStateDependencies) =>
  <T>(
    key: string,
    initializer: (storedValue: T | undefined) => T,
    options?: UseCookieStateOptions<T>
  ) => {
    const { retrieve, store, clear, needsSync } = useCookie<T>(key);

    const { autoStore = true } = options ?? {};

    const [value, setValue] = useState<T>(() =>
      initializer(needsSync ? undefined : retrieve())
    );

    useSyncWithCookie<T>(key, () => {
      boundRetrieve();
    });

    const boundRetrieve = (options?: {
      deserializer?: (storedValue: T | undefined) => T;
    }) => {
      const { deserializer } = options ?? {};

      const storedValue = retrieve();

      if (deserializer === undefined) {
        setValue(storedValue ?? initializer(storedValue));
        return;
      }

      setValue(deserializer(storedValue));
    };

    const boundStore = (options?: {
      attributes?: CookieAttributes;
      serializer?: (value: T) => T;
    }) => {
      const { attributes, serializer = identity } = options ?? {};

      const valueToBePersisted = serializer(value);

      store(valueToBePersisted, attributes);
    };

    const boundClear = () => {
      clear();
      setValue(initializer(undefined));
    };

    const decoratedSetValue = (...args: Parameters<typeof setValue>) => {
      setValue(...args);

      if (Boolean(autoStore)) {
        boundStore();
      }
    };

    return {
      value,
      setValue,
      retrieve: boundRetrieve,
      store: boundStore,
      clear: boundClear,
      needsSync,
    };
  };

type UseServerSideCookieStateDependencies = {
  useCookie: UseCookie;
};

export const makeUseServerSideCookieState =
  ({ useCookie }: UseServerSideCookieStateDependencies) =>
  <T>(key: string, initializer: (storedValue: T | undefined) => T) => {
    const { retrieve, needsSync } = useCookie<T>(key);

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
      needsSync,
    };
  };
