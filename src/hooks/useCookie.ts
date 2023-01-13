import { Logger } from "../utils/logger";
import { useCookiesInServer } from "./useCookiesInServer";
import { UseIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";
import { CookieAttributes, Cookies } from "../cookies/Cookies";
import { useCallback, useMemo } from "react";

export type UseCookie = <T>(key: string) => {
  /**
   * Retrieves cookie value.
   *
   * In the server **and during hydration**, ALWAYS
   * returns the server cookie value, to prevent
   * hydration mismatches.
   *
   * After hydration, returns the client cookie value.
   */
  retrieve: () => T | undefined;

  /**
   * Stores value in cookie.
   */
  store: (data: T, attributes?: CookieAttributes) => void;

  /**
   * Clear cookie value.
   */
  clear: (attributes?: CookieAttributes) => void;

  /**
   * True whenever there are no cookies in the server, either because
   * we're using SSG, or because we didn't wrap `getServerSideProps`
   * with `withCookiesGetServerSideWrapper` AND it is hydrating.
   *
   * This indicates that we need to synchronize React state
   * with client side cookie value after hydration.
   */
  needsSync: boolean;
};

type UseClientSideCookiesDependencies = {
  useCookiesInServer: typeof useCookiesInServer;
  Cookies: Cookies;
  useIsomorphicLayoutEffect: UseIsomorphicLayoutEffect;
  logger: Logger;
};

export const makeUseClientSideCookie =
  ({
    Cookies,
    useCookiesInServer,
    useIsomorphicLayoutEffect,
    logger,
  }: UseClientSideCookiesDependencies) =>
  <T>(key: string) => {
    const { cookiesInServer, isHydratingRef } = useCookiesInServer();

    const noCookiesInServer = cookiesInServer === null;
    const needsSync = noCookiesInServer && isHydratingRef.current;

    useIsomorphicLayoutEffect(() => {
      isHydratingRef.current = false;
    }, []);

    const retrieve = useCallback((): T | undefined => {
      // Here we want to have the freshest value possible
      const needsSyncAfterHydration =
        noCookiesInServer && isHydratingRef.current;

      if (needsSyncAfterHydration) {
        logger.warn(
          "This page did not receive initial cookies (either because it uses SSG or because you didn't wrap getServerSideProps with withCokiesGetServerSidePropsWrapper) and you're calling retrieve during hydration, so your data will probably not be initialized correctly.\nTo prevent hydration mismatches, every time retrieve is called during hydration, it returns the cookie value that was sent by the server, which, in this case, is undefined."
        );
      }

      // In case cookie changes during render,
      // and to avoid hydration mismatches at all
      // costs
      const serializedData = isHydratingRef.current
        ? cookiesInServer?.[key]
        : Cookies.get(key);

      if (serializedData === undefined) {
        return undefined;
      }

      return JSON.parse(serializedData);
    }, [noCookiesInServer, isHydratingRef, cookiesInServer, key]);

    const store = useCallback(
      (data: T, attributes?: CookieAttributes) => {
        Cookies.set(key, JSON.stringify(data), attributes);
      },
      [key]
    );

    const clear = useCallback(() => {
      Cookies.remove(key);
    }, [key]);

    return {
      store,
      retrieve,
      clear,
      needsSync,
    };
  };

type UseServerSideCookiesDependencies = {
  useCookiesInServer: typeof useCookiesInServer;
};

export const makeUseServerSideCookie =
  ({ useCookiesInServer }: UseServerSideCookiesDependencies) =>
  <T>(key: string) => {
    const { cookiesInServer, isHydratingRef } = useCookiesInServer();

    const noCookiesInServer = cookiesInServer === null;
    const needsSync = noCookiesInServer && isHydratingRef.current;

    const retrieve = useMemo(() => {
      return (): T | undefined => {
        if (noCookiesInServer) {
          return undefined;
        }

        const serializedCookie = cookiesInServer[key];
        if (serializedCookie === undefined) {
          return undefined;
        }

        return JSON.parse(serializedCookie);
      };
    }, [cookiesInServer, key, noCookiesInServer]);

    // No Op
    const store = useCallback((): void => undefined, []);

    // No Op
    const clear = useCallback((): void => undefined, []);

    return {
      store,
      retrieve,
      clear,
      needsSync,
    };
  };
