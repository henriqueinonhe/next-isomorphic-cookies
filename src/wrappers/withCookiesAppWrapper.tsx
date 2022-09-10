import { AppProps } from "next/app";
import React from "react";
import { CookiesProvider } from "../components/CookiesProvider";

type App<P extends {}> = (props: AppProps<P>) => JSX.Element;

type WithCookiesProps = {
  cookies: Record<string, string>;
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
      <CookiesProvider
        cookies={props.pageProps.cookies ?? null}
        isHydratingRef={isHydratingRef}
      >
        <App {...props} />
      </CookiesProvider>
    );
  };
};
