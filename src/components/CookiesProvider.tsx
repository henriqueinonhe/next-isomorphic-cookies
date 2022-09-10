import React, { createContext, ReactNode, useMemo } from "react";

type CookiesContextValue = {
  cookiesInServer: Record<string, string> | null;
  isHydratingRef: { current: boolean };
};

export const CookiesContext = createContext<CookiesContextValue | undefined>(
  undefined
);

type CookiesProviderProps = {
  children: ReactNode;
  cookies: Record<string, string> | null;
  isHydratingRef: { current: boolean };
};

export const CookiesProvider = ({
  children,
  cookies,
  isHydratingRef,
}: CookiesProviderProps) => {
  const value = useMemo(
    () => ({
      isHydratingRef,
      cookiesInServer: cookies,
    }),
    [cookies, isHydratingRef]
  );

  return (
    <CookiesContext.Provider value={value}>{children}</CookiesContext.Provider>
  );
};
