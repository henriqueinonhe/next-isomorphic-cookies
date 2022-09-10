import { AppProps } from "next/app";
import React from "react";
import { CookiesInServerProvider } from "../components/CookiesInServerProvider";

type App<P extends {}> = (props: AppProps<P>) => JSX.Element;

export type WithCookiesProps = {
  __next_isomorphic_cookies: Record<string, string>;
};

type AppWithCookies<P extends {}> = (
  props: AppProps<P> & {
    pageProps: WithCookiesProps;
  }
) => JSX.Element;

export const withCookiesAppWrapper = <P extends {}>(
  App: App<P>
): AppWithCookies<P> => {
  // We need to create this outside the component,
  // because it might get remounted
  let isHydratingRef = {
    current: true,
  };

  // eslint-disable-next-line react/display-name
  return (props) => {
    return (
      <CookiesInServerProvider
        // We fallback to null when we don't receive
        // __next_isomorphic_cookies (in SSG or when
        // the user doesn't wrap getServerSideProps)
        // to differentiate between not forgetting to
        // wrap App (which makes the context value undefined)
        // and not receiving cookies.
        cookiesInServer={props.pageProps.__next_isomorphic_cookies ?? null}
        isHydratingRef={isHydratingRef}
      >
        <App {...props} />
      </CookiesInServerProvider>
    );
  };
};
