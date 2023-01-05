import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { CookieAttributes } from "../cookies/Cookies";
import { identity } from "../utils/identity";
import { IfThenElse, IsEqual } from "../utils/types";
import { updatedValueFromUpdater, Updater } from "../utils/updater";
import { UseCookie } from "./useCookie";
import { UseSyncWithCookie } from "./useSyncWithCookie";

export type UseCookieState = {
  <State>(
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
    initializer: (value: State | undefined) => State,

    options?: UseCookieStateOptions<State, State>
  ): UseCookieStateReturnValue<State>;

  <State, SerializedState>(
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
    initializer: (value: State | undefined) => State,

    options: UseCookieStateOptions<State, SerializedState>
  ): UseCookieStateReturnValue<State>;
};

type UseCookieStateOptions<State, SerializedState> = {
  /**
   * Defaults to true.
   *
   * Whether the value should be stored
   * in the cookie everytime setValue
   * is called.
   *
   * It is possible to pass a serializer
   * that will transform the value
   * before it is stored as a cookie or a
   * deserializer that will transform the value
   * after it is retrieved from the cookie.
   */
  storeOnSet?: StoreOnSetOption;
} & IfThenElse<
  IsEqual<State, SerializedState>,
  {
    /**
     * Transforms the value before
     * it is stored.
     *
     * Defaults to identity function.
     */
    serializer?: (value: State) => SerializedState;

    /**
     * Transforms the cookie value before
     * setting value to it.
     *
     * Defaults to identity function.
     */
    deserializer?: (value: SerializedState) => State;
  },
  {
    /**
     * Transforms the value before
     * it is stored.
     */
    serializer: (value: State) => SerializedState;

    /**
     * Transforms the cookie value before
     * setting value to it.
     */
    deserializer: (value: SerializedState) => State;
  }
>;

type StoreOnSetOption =
  | true
  | false
  | {
      /**
       * js-cookie attributes
       */
      attributes?: CookieAttributes;
    };

type UseCookieStateReturnValue<State> = {
  /**
   * Pretty much like the value you'd get
   * when calling `useState`.
   */
  value: State;

  /**
   * Pretty much like the setter you'd get
   * when calling `useState`.
   *
   * When `storeOnSet` option is enabled,
   * everytime this is called, it also
   * stores the value it was called with
   * in the cookie.
   */
  setValue: Dispatch<SetStateAction<State>>;

  /**
   * Reads value off cookie and calls sets
   * `value` to it.
   */
  retrieve: () => void;

  /**
   * Stores value in cookie.
   */
  store: (options?: {
    /**
     * js-cookie attributes
     */
    attributes?: CookieAttributes;
  }) => void;
  clear: () => void;
  isSyncing: boolean;
};

type UseClientSideCookieStateDependencies = {
  useCookie: UseCookie;
  useSyncWithCookie: UseSyncWithCookie;
};

export const makeUseClientSideCookieState =
  ({
    useCookie,
    useSyncWithCookie,
  }: UseClientSideCookieStateDependencies): UseCookieState =>
  <State, SerializedState = State>(
    key: string,
    initializer: (value: State | undefined) => State,
    options?: UseCookieStateOptions<State, SerializedState>
  ) => {
    const {
      storeOnSet = true,
      deserializer = identity as (x: SerializedState) => State,
      serializer = identity as (x: State) => SerializedState,
    } = options ?? {};

    const {
      retrieve: retrieveSerializedValue,
      store: storeSerializedValue,
      clear,
      needsSync,
    } = useCookie<SerializedState>(key);

    const retrieve = useCallback(() => {
      const serializedValue = retrieveSerializedValue();
      if (serializedValue === undefined) {
        return undefined;
      }

      return deserializer(serializedValue);
    }, [deserializer, retrieveSerializedValue]);

    const store = useCallback(
      (value: State, attributes?: CookieAttributes) => {
        storeSerializedValue(serializer(value), attributes);
      },
      [serializer, storeSerializedValue]
    );

    const [value, setValue] = useState<State>(() =>
      initializer(needsSync ? undefined : retrieve())
    );

    useSyncWithCookie<State>(key, () => {
      const value = retrieve();

      // This is a kind of re-initialization
      // of the state, thus we call the
      // stored value with the initializer
      setValue(initializer(value));
    });

    const boundRetrieve = useCallback(() => {
      const value = retrieve();

      setValue(value ?? initializer(value));
    }, [initializer, retrieve]);

    type BoundStoreOptions = {
      attributes?: CookieAttributes;
    };

    const boundStore = useCallback(
      (options?: BoundStoreOptions) => {
        const { attributes } = options ?? {};

        store(value, attributes);
      },
      [store, value]
    );

    const boundClear = useCallback(() => {
      clear();
      setValue(initializer(undefined));
    }, [clear, initializer]);

    const decoratedSetValue = useCallback(
      (updater: Updater<State>) => {
        setValue((currentValue) => {
          const updatedValue = updatedValueFromUpdater(currentValue, updater);

          if (Boolean(storeOnSet)) {
            const { attributes } = storeOnSet as Exclude<
              StoreOnSetOption,
              boolean
            >;

            store(updatedValue, {
              attributes,
            });
          }

          return updatedValue;
        });
      },
      [store, storeOnSet]
    );

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
  ({ useCookie }: UseServerSideCookieStateDependencies): UseCookieState =>
  <State, SerializedState = State>(
    key: string,
    initializer: (value: State | undefined) => State,
    options?: UseCookieStateOptions<State, SerializedState>
  ) => {
    const { deserializer = identity as (x: SerializedState) => State } =
      options ?? {};

    const { retrieve: retrieveSerializedValue, needsSync } =
      useCookie<SerializedState>(key);

    const retrieve = useCallback(() => {
      const serializedValue = retrieveSerializedValue();
      if (serializedValue === undefined) {
        return undefined;
      }

      return deserializer(serializedValue);
    }, [deserializer, retrieveSerializedValue]);

    const [value, setValue] = useState<State>(() => initializer(retrieve()));

    const boundRetrieve = useCallback(() => {
      const storedValue = retrieve();
      setValue(storedValue ?? initializer(storedValue));
    }, [initializer, retrieve]);

    // No Op
    const boundStore = useCallback(() => undefined, []);

    const boundClear = useCallback(() => {
      setValue(initializer(undefined));
    }, [initializer]);

    return {
      value,
      setValue,
      retrieve: boundRetrieve,
      store: boundStore,
      clear: boundClear,
      isSyncing: needsSync,
    };
  };
