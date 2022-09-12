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
import { devLogger, prodLogger } from "./utils/logger";
import { withCookiesAppWrapper } from "./wrappers/withCookiesAppWrapper";
import { withCookiesGetServerSidePropsWrapper } from "./wrappers/withCookiesGetServerSidePropsWrapper";

const logger = process.env.NODE_ENV === "production" ? prodLogger : devLogger;

const useIsomorphicLayoutEffect = isServer() ? useEffect : useLayoutEffect;

const useCookie = isServer()
  ? makeUseServerSideCookie({
      useCookiesInServer,
    })
  : makeUseClientSideCookie({
      Cookies,
      useCookiesInServer,
      useIsomorphicLayoutEffect,
      logger,
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

export {
  useCookie,
  useSyncWithCookie,
  useCookieState,
  withCookiesAppWrapper,
  withCookiesGetServerSidePropsWrapper,
};
