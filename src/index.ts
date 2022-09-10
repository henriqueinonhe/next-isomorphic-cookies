import {
  makeUseClientSideCookie,
  makeUseServerSideCookie,
} from "./hooks/useCookie";
import { useCookiesInServer } from "./hooks/useCookiesInServer";
import { isServer } from "./utils/isServer";
import Cookies from "js-cookie";
import { useEffect, useLayoutEffect } from "react";
import {
  makeUseClientSideCookieState,
  makeUseServerSideCookieState,
} from "./hooks/useCookieState";
import { makeUseSyncWithCookie } from "./hooks/useSyncWithCookie";

const useIsomorphicLayoutEffect = isServer() ? useEffect : useLayoutEffect;

const useCookie = isServer()
  ? makeUseServerSideCookie({
      useCookiesInServer,
    })
  : makeUseClientSideCookie({
      Cookies,
      useCookiesInServer,
      useIsomorphicLayoutEffect,
    });

const useSyncWithCookie = makeUseSyncWithCookie({
  useCookie,
  useIsomorphicLayoutEffect,
});

const useCookieState = isServer()
  ? makeUseServerSideCookieState({
      useCookie,
    })
  : makeUseClientSideCookieState({
      useCookie,
      useSyncWithCookie,
    });

export { useCookie, useSyncWithCookie, useCookieState };
