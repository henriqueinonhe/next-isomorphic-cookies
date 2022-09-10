import { useIsomorphicLayoutEffect } from "../hooks/useIsomorphicLayoutEffect";
import { useCookie } from "./useCookie";

export const useSyncWithCookie = <T>(
  key: string,
  sync: (cookieValue: T | undefined) => void
) => {
  const { retrieve, needsSyncAfterHydration } = useCookie<T>(key);

  useIsomorphicLayoutEffect(() => {
    if (needsSyncAfterHydration) {
      sync(retrieve());
    }
  }, []);
};
