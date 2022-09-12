import { Dispatch, SetStateAction, useState } from "react";
import { CookieAttributes } from "../cookies/Cookies";
import { identity } from "../utils/identity";
import { updatedValueFromUpdater, Updater } from "../utils/updater";
import { UseCookie } from "./useCookie";
import { UseSyncWithCookie } from "./useSyncWithCookie";

export type UseCookieState<T> = (
  key: string,
  initializer: (storedValue: T | undefined) => T,
  options?: UseCookieStateOptions<T>
) => {
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
  retrieve: (options?: {
    deserializer?: (storedValue: T | undefined) => T;
  }) => void;
  store: (
    value: T,
    options?: {
      attributes?: CookieAttributes;
      serializer?: (storedValue: T | undefined) => T;
    }
  ) => void;
  clear: () => void;
  needsSync: boolean;
};

type UseCookieStateOptions<T> = {
  storeOnSet?: StoreOnSetOption<T>;
};

type StoreOnSetOption<T> =
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

    const { storeOnSet = true } = options ?? {};

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

    const boundStore = (
      value: T,
      options?: {
        attributes?: CookieAttributes;
      }
    ) => {
      const { attributes } = options ?? {};

      store(value, attributes);
    };

    const boundClear = () => {
      clear();
      setValue(initializer(undefined));
    };

    const decoratedSetValue = (updater: Updater<T>) => {
      setValue((currentValue) => {
        const updatedValue = updatedValueFromUpdater(currentValue, updater);

        if (Boolean(storeOnSet)) {
          const { attributes = {}, serializer = identity } =
            storeOnSet as Exclude<StoreOnSetOption<T>, boolean>;

          const valueToBeStored = serializer(updatedValue);

          boundStore(valueToBeStored, {
            attributes,
          });
        }

        return updatedValue;
      });
    };

    return {
      value,
      setValue: decoratedSetValue,
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
