import Cookies from "js-cookie";
import { Logger } from "../utils/logger";
import { useCookiesInServer } from "./useCookiesInServer";
import { UseIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

type UseClientSideCookiesDependencies = {
  useCookiesInServer: typeof useCookiesInServer;
  Cookies: typeof Cookies;
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
      // HACK (Kinda)
      isHydratingRef.current = false;
    }, []);

    const retrieve = (): T | undefined => {
      // HACK (Kinda)
      // Here we want to have the freshest value possible
      const needsSyncAfterHydration =
        noCookiesInServer && isHydratingRef.current;

      if (needsSyncAfterHydration) {
        logger.warn(
          "This page did not receive initial cookies (either because it uses SSG or because you didn't wrap getServerSideProps with withCokiesGetServerSidePropsWrapper) and you're calling retrieve during hydration, so your data will probably not be initialized correctly.\nTo prevent hydration mismatches, every time retrieve is called during hydration, it returns the cookie value that was sent to the server, which, in this case, is undefined."
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
    };

    const store = (data: T) => {
      Cookies.set(key, JSON.stringify(data));
    };

    const clear = () => Cookies.remove(key);

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

    const retrieve = (): T | undefined =>
      noCookiesInServer ? undefined : JSON.parse(cookiesInServer[key]);

    // No Op
    const store = (): void => undefined;

    // No Op
    const clear = (): void => undefined;

    return {
      store,
      retrieve,
      clear,
      needsSync,
    };
  };

export type UseCookie =
  | ReturnType<typeof makeUseClientSideCookie>
  | ReturnType<typeof makeUseServerSideCookie>;
