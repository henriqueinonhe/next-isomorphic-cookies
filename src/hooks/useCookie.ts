import Cookies from "js-cookie";
import { useIsomorphicLayoutEffect } from "../hooks/useIsomorphicLayoutEffect";
import { useCookiesInServer } from "./useCookiesInServer";

const useClientSideCookies = <T>(key: string) => {
  const { cookiesInServer, isHydratingRef } = useCookiesInServer();

  const noCookiesInServer = cookiesInServer === null;
  const needsSyncAfterHydration = noCookiesInServer && isHydratingRef.current;

  useIsomorphicLayoutEffect(() => {
    if (typeof document !== "undefined") {
      isHydratingRef.current = false;
    }
  }, []);

  const store = (data: T) => {
    Cookies.set(key, JSON.stringify(data));
  };

  const retrieve = (): T | undefined => {
    // Here we want to have the freshest value possible
    const needsSyncAfterHydration = noCookiesInServer && isHydratingRef.current;

    if (needsSyncAfterHydration) {
      console.warn(
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

  const clear = () => Cookies.remove(key);

  return {
    store,
    retrieve,
    clear,
    needsSyncAfterHydration,
  };
};

const useServerSideCookies = <T>(key: string) => {
  const { cookiesInServer, isHydratingRef } = useCookiesInServer();

  const noCookiesInServer = cookiesInServer === null;
  const needsSyncAfterHydration = noCookiesInServer && isHydratingRef.current;

  // No Op
  const store = () => undefined;

  const retrieve = (): T | undefined =>
    noCookiesInServer ? undefined : JSON.parse(cookiesInServer[key]);

  // No Op
  const clear = () => undefined;

  return {
    store,
    retrieve,
    clear,
    needsSyncAfterHydration,
  };
};

export const useCookie =
  typeof document !== "undefined" ? useClientSideCookies : useServerSideCookies;
