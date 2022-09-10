import { useContext } from "react";
import { CookiesInServerContext } from "../components/CookiesInServerProvider";

export const useCookiesInServer = () => {
  const value = useContext(CookiesInServerContext);

  if (value === undefined) {
    throw new Error("Provider missing!");
  }

  return value;
};

export type UseCookiesInServer = typeof useCookiesInServer;
