import { Dispatch, SetStateAction, useState } from "react";
import { CookieAttributes } from "../cookies/Cookies";
import { identity } from "../utils/identity";
import { updatedValueFromUpdater, Updater } from "../utils/updater";
import { UseCookie } from "./useCookie";
import { UseSyncWithCookie } from "./useSyncWithCookie";

export type UseCookieState<T> = (
  /**
   * Cookie key/name.
   */
  key: string,

  /**
   * Function that is called to initialize
   * the state value and, in cases where
   * cookies are not available on the server,
   * again after hydration.
   */
  initializer: (storedValue: T | undefined) => T,

  options?: UseCookieStateOptions<T>
) => {
  /**
   * Pretty much like the value you'd get
   * when calling `useState`.
   */
  value: T;

  /**
   * Pretty much like the setter you'd get
   * when calling `useState`.
   *
   * When `storeOnSet` option is enabled,
   * everytime this is called, it also
   * stores the value it was called with
   * in the cookie.
   */
  setValue: Dispatch<SetStateAction<T>>;

  /**
   * Reads value off cookie and calls sets
   * `value` to it.
   *
   * You may optionally pass a `deserializer`
   * that transforms the cookie value before
   * setting value to it.
   */
  retrieve: (options?: {
    /**
     * Transforms the cookie value before
     * setting value to it.
     *
     * Defaults to identity function.
     */
    deserializer?: (storedValue: T | undefined) => T;
  }) => void;

  /**
   * Stores value in cookie.
   */
  store: (
    /**
     * Value to be stored.
     */
    value: T,

    options?: {
      /**
       * js-cookie attributes
       */
      attributes?: CookieAttributes;
      /**
       * Transforms the value before
       * it is stored.
       *
       * Defaults to identity function.
       */
      serializer?: (storedValue: T | undefined) => T;
    }
  ) => void;
  clear: () => void;
  isSyncing: boolean;
};

type UseCookieStateOptions<T> = {
  /**
   * Defaults to true.
   *
   * Whether the value should be stored
   * in the cookie everytime setValue
   * is called.
   *
   * It is possible to pass a serializer
   * that will transform the value
   * before it is stored as a cookie.
   */
  storeOnSet?: StoreOnSetOption<T>;
};

type StoreOnSetOption<T> =
  | true
  | false
  | {
      /**
       * js-cookie attributes
       */
      attributes?: CookieAttributes;

      /**
       * Transforms the value before
       * it is stored.
       *
       * Defaults to identity function.
       */
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
      const storedValue = retrieve();

      // This is a kind of re-initialization
      // of the state, thus we call the
      // stored value with the initializer
      setValue(initializer(storedValue));
    });

    const boundRetrieve = (options?: {
      deserializer?: (storedValue: T | undefined) => T;
    }) => {
      const { deserializer } = options ?? {};

      const storedValue = retrieve();

      if (deserializer === undefined) {
        // If there is no stored value
        // we reset the component to it's
        // "default value" by calling
        // the initializer with undefined
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
      isSyncing: needsSync,
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
      isSyncing: needsSync,
    };
  };
