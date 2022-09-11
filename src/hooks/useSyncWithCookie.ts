import { UseIsomorphicLayoutEffect } from "../hooks/useIsomorphicLayoutEffect";
import { UseCookie } from "./useCookie";

type Dependencies = {
  useIsomorphicLayoutEffect: UseIsomorphicLayoutEffect;
  useCookie: UseCookie;
};

export const makeUseSyncWithCookie =
  ({ useCookie, useIsomorphicLayoutEffect }: Dependencies) =>
  <T>(key: string, sync: (cookieValue: T | undefined) => void) => {
    const { retrieve, needsSync } = useCookie<T>(key);

    useIsomorphicLayoutEffect(() => {
      if (needsSync) {
        sync(retrieve());
      }
    }, []);
  };

export type UseSyncWithCookie = ReturnType<typeof makeUseSyncWithCookie>;
