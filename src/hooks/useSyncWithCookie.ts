import { UseIsomorphicLayoutEffect } from "../hooks/useIsomorphicLayoutEffect";
import { UseCookie } from "./useCookie";

type Dependencies = {
  useIsomorphicLayoutEffect: UseIsomorphicLayoutEffect;
  useCookie: UseCookie;
};

export const makeUseSyncWithCookie =
  ({ useCookie, useIsomorphicLayoutEffect }: Dependencies) =>
  <T>(key: string, sync: (cookieValue: T | undefined) => void) => {
    const { retrieve, needsSyncAfterHydration } = useCookie<T>(key);

    useIsomorphicLayoutEffect(() => {
      if (needsSyncAfterHydration) {
        sync(retrieve());
      }
    }, []);
  };

export type UseSyncWithCookie = ReturnType<typeof makeUseSyncWithCookie>;
