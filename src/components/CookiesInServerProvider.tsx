import React, { createContext, ReactNode, useMemo } from "react";

type CookiesInServerContextValue = {
  cookiesInServer: Record<string, string> | null;
  isHydratingRef: { current: boolean };
};

export const CookiesInServerContext = createContext<
  CookiesInServerContextValue | undefined
>(undefined);

type CookiesProviderProps = {
  children: ReactNode;
  cookiesInServer: Record<string, string> | null;
  isHydratingRef: { current: boolean };
};

export const CookiesInServerProvider = ({
  children,
  cookiesInServer,
  isHydratingRef,
}: CookiesProviderProps) => {
  const value = useMemo(
    () => ({
      isHydratingRef,
      cookiesInServer,
    }),
    [cookiesInServer, isHydratingRef]
  );

  return (
    <CookiesInServerContext.Provider value={value}>
      {children}
    </CookiesInServerContext.Provider>
  );
};
