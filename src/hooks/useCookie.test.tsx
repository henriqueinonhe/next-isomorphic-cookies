import type { UseCookiesInServer } from "./useCookiesInServer";
import { makeUseClientSideCookie, makeUseServerSideCookie } from "./useCookie";
import { render, renderHook } from "@testing-library/react";
import { UseIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";
import { useEffect, useLayoutEffect } from "react";
import { Logger } from "../utils/logger";
import React from "react";
import Cookie from "js-cookie";

describe("When in the server", () => {
  type SetupParameters = {
    cookiesInServer: ReturnType<UseCookiesInServer>["cookiesInServer"];
  };

  const setup = ({ cookiesInServer }: SetupParameters) => {
    const key = "firstCookie";

    const isHydratingRef = {
      current: true,
    };

    const useCookiesInServer: UseCookiesInServer = () => {
      return {
        cookiesInServer,
        isHydratingRef,
      };
    };

    const useServerSideCookie = makeUseServerSideCookie({
      useCookiesInServer,
    });

    const renderHookReturnValue = renderHook(() => useServerSideCookie(key), {
      hydrate: true,
    });

    return {
      renderHookReturnValue,
    };
  };

  describe("And there are no cookies in server", () => {
    const secondSetup = () =>
      setup({
        cookiesInServer: null,
      });

    describe("And we're retrieving", () => {
      const thirdSetup = secondSetup;
      it("Returns undefined", () => {
        const { renderHookReturnValue } = thirdSetup();

        expect(renderHookReturnValue.result.current.retrieve()).toBeUndefined();
      });
    });
  });

  describe("And there ARE cookies in server", () => {
    const secondSetup = () => {
      const cookiesInServer = {
        firstCookie: JSON.stringify("firstCookie"),
        secondCookie: JSON.stringify("secondCookie"),
      };

      return { ...setup({ cookiesInServer }), cookiesInServer };
    };

    describe("And we're retrieving", () => {
      const thirdSetup = secondSetup;

      it("Returns cookies in server", () => {
        const { renderHookReturnValue, cookiesInServer } = thirdSetup();

        expect(renderHookReturnValue.result.current.retrieve()).toStrictEqual(
          JSON.parse(cookiesInServer.firstCookie)
        );
      });
    });
  });

  describe("When calling store", () => {
    const secondSetup = () => {
      const { renderHookReturnValue } = setup({ cookiesInServer: null });

      renderHookReturnValue.result.current.store();
    };

    it("No op", () => {
      expect(() => secondSetup()).not.toThrow();
    });
  });

  describe("When calling clear", () => {
    const secondSetup = () => {
      const { renderHookReturnValue } = setup({ cookiesInServer: null });

      renderHookReturnValue.result.current.clear();
    };

    it("No op", () => {
      expect(() => secondSetup()).not.toThrow();
    });
  });
});

describe("When in the client", () => {
  type SetupParameters = {
    cookiesInClient: Record<string, string>;
    cookiesInServer: ReturnType<UseCookiesInServer>["cookiesInServer"];
    isHydratingRef: ReturnType<UseCookiesInServer>["isHydratingRef"];
  };

  const setup = ({
    cookiesInClient,
    cookiesInServer,
    isHydratingRef,
  }: SetupParameters) => {
    const Cookies = {
      get: (key: string) => cookiesInClient[key],
      set: jest.fn(),
      remove: jest.fn(),
    } as unknown as typeof Cookie;

    const useCookiesInServer: UseCookiesInServer = () => ({
      cookiesInServer,
      isHydratingRef,
    });

    const useIsomorphicLayoutEffect: UseIsomorphicLayoutEffect =
      useLayoutEffect;

    const logger = {
      warn: jest.fn(),
    } as unknown as Logger;

    const useCookie = makeUseClientSideCookie({
      Cookies,
      useCookiesInServer,
      useIsomorphicLayoutEffect,
      logger,
    });

    const key = "SomeCookie";

    return {
      key,
      useCookie,
      logger,
      Cookies,
    };
  };

  describe("And it is hydrating", () => {
    type SecondSetupParameters = {
      cookiesInClient: SetupParameters["cookiesInClient"];
      cookiesInServer: SetupParameters["cookiesInServer"];
    };

    const secondSetup = ({
      cookiesInClient,
      cookiesInServer,
    }: SecondSetupParameters) => {
      const isHydratingRef = {
        current: true,
      };

      return setup({ cookiesInClient, cookiesInServer, isHydratingRef });
    };

    describe("And there are cookies in the server", () => {
      const thirdSetup = () => {
        const cookiesInClient = {
          SomeCookie: JSON.stringify("SomeOtherValue"),
        };

        const cookiesInServer = {
          SomeCookie: JSON.stringify("SomeValue"),
        };

        return {
          cookiesInClient,
          cookiesInServer,
          ...secondSetup({ cookiesInClient, cookiesInServer }),
        };
      };

      it("Needs sync is false", () => {
        const { key, useCookie } = thirdSetup();

        const { result } = renderHook(() => useCookie(key));

        expect(result.current.needsSync).toBe(false);
      });

      describe("And we call retrieve during RENDER", () => {
        const fourthSetup = () => {
          const thirdSetupReturnValue = thirdSetup();
          const { useCookie, key } = thirdSetupReturnValue;

          let retrieveReturnValue: string;

          const Component = () => {
            const { retrieve } = useCookie(key);
            retrieveReturnValue = retrieve() as string;

            return <></>;
          };

          render(<Component />);

          return {
            ...thirdSetupReturnValue,
            retrieveReturnValue: retrieveReturnValue!,
          };
        };

        it("Returns SERVER cookie value", () => {
          const { retrieveReturnValue } = fourthSetup();

          expect(retrieveReturnValue).toBe("SomeValue");
        });

        it("Does NOT warn user", () => {
          const { logger } = fourthSetup();

          expect(logger.warn).not.toHaveBeenCalled();
        });
      });
    });

    describe("And there are NO cookies in the server", () => {
      const thirdSetup = () =>
        secondSetup({ cookiesInClient: {}, cookiesInServer: null });

      it("Needs sync is true", () => {
        const { key, useCookie } = thirdSetup();

        const { result } = renderHook(() => useCookie(key));

        expect(result.current.needsSync).toBe(true);
      });

      describe("And we call retrieve during RENDER", () => {
        const fourthSetup = () => {
          const thirdSetupReturnValue = thirdSetup();
          const { useCookie, key } = thirdSetupReturnValue;

          let retrieveReturnValue: string;

          const Component = () => {
            const { retrieve } = useCookie(key);
            retrieveReturnValue = retrieve() as string;

            return <></>;
          };

          render(<Component />);

          return {
            ...thirdSetupReturnValue,
            retrieveReturnValue: retrieveReturnValue!,
          };
        };

        it("Returns SERVER cookie value", () => {
          const { retrieveReturnValue } = fourthSetup();

          expect(retrieveReturnValue).toBeUndefined();
        });

        it("Warns user", () => {
          const { logger } = fourthSetup();

          expect(logger.warn).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe("And we call retrieve inside useLayoutEffect", () => {
      const fourthSetup = () => {
        const cookiesInClient = {
          SomeCookie: JSON.stringify("SomeOtherValue"),
        };

        const thirdSetupReturnValue = secondSetup({
          cookiesInClient,
          cookiesInServer: null,
        });

        const { useCookie, key } = thirdSetupReturnValue;

        let retrieveReturnValue: string;
        const Component = () => {
          const { retrieve } = useCookie<string>(key);

          useLayoutEffect(() => {
            retrieveReturnValue = retrieve() as string;
          }, []);

          return <></>;
        };

        render(<Component />);

        return {
          ...thirdSetupReturnValue,
          retrieveReturnValue: retrieveReturnValue!,
        };
      };

      it("Returns CLIENT cookie", () => {
        const { retrieveReturnValue } = fourthSetup();

        expect(retrieveReturnValue).toBe("SomeOtherValue");
      });
    });

    describe("And we call retrieve inside useEffect", () => {
      const fourthSetup = () => {
        const cookiesInClient = {
          SomeCookie: JSON.stringify("SomeOtherValue"),
        };

        const thirdSetupReturnValue = secondSetup({
          cookiesInClient,
          cookiesInServer: null,
        });

        const { useCookie, key } = thirdSetupReturnValue;

        let retrieveReturnValue: string;
        const Component = () => {
          const { retrieve } = useCookie<string>(key);

          useEffect(() => {
            retrieveReturnValue = retrieve() as string;
          }, []);

          return <></>;
        };

        render(<Component />);

        return {
          ...thirdSetupReturnValue,
          retrieveReturnValue: retrieveReturnValue!,
        };
      };

      it("Returns CLIENT cookie", () => {
        const { retrieveReturnValue } = fourthSetup();

        expect(retrieveReturnValue).toBe("SomeOtherValue");
      });
    });
  });

  describe("And it is NOT hydrating", () => {
    type SecondSetupParameters = {
      cookiesInClient: SetupParameters["cookiesInClient"];
      cookiesInServer: SetupParameters["cookiesInServer"];
    };

    const secondSetup = ({
      cookiesInClient,
      cookiesInServer,
    }: SecondSetupParameters) => {
      const isHydratingRef = {
        current: false,
      };

      return setup({ cookiesInClient, cookiesInServer, isHydratingRef });
    };

    describe("And there are cookies in the server", () => {
      const thirdSetup = () => {
        const cookiesInClient = {
          SomeCookie: JSON.stringify("SomeOtherValue"),
        };

        const cookiesInServer = {
          SomeCookie: JSON.stringify("SomeValue"),
        };

        return {
          cookiesInClient,
          cookiesInServer,
          ...secondSetup({ cookiesInClient, cookiesInServer }),
        };
      };

      it("Needs sync is false", () => {
        const { key, useCookie } = thirdSetup();

        const { result } = renderHook(() => useCookie(key));

        expect(result.current.needsSync).toBe(false);
      });

      describe("And we call retrieve during RENDER", () => {
        const fourthSetup = () => {
          const thirdSetupReturnValue = thirdSetup();
          const { useCookie, key } = thirdSetupReturnValue;

          let retrieveReturnValue: string;

          const Component = () => {
            const { retrieve } = useCookie(key);
            retrieveReturnValue = retrieve() as string;

            return <></>;
          };

          render(<Component />);

          return {
            ...thirdSetupReturnValue,
            retrieveReturnValue: retrieveReturnValue!,
          };
        };

        it("Returns CLIENT cookie value", () => {
          const { retrieveReturnValue } = fourthSetup();

          expect(retrieveReturnValue).toBe("SomeOtherValue");
        });

        it("Does NOT warn user", () => {
          const { logger } = fourthSetup();

          expect(logger.warn).not.toHaveBeenCalled();
        });
      });
    });

    describe("And there are NO cookies in the server", () => {
      const thirdSetup = () =>
        secondSetup({
          cookiesInClient: {
            SomeCookie: JSON.stringify("SomeOtherValue"),
          },
          cookiesInServer: null,
        });

      it("Needs sync is false", () => {
        const { key, useCookie } = thirdSetup();

        const { result } = renderHook(() => useCookie(key));

        expect(result.current.needsSync).toBe(false);
      });

      describe("And we call retrieve during RENDER", () => {
        const fourthSetup = () => {
          const thirdSetupReturnValue = thirdSetup();
          const { useCookie, key } = thirdSetupReturnValue;

          let retrieveReturnValue: string;

          const Component = () => {
            const { retrieve } = useCookie(key);
            retrieveReturnValue = retrieve() as string;

            return <></>;
          };

          render(<Component />);

          return {
            ...thirdSetupReturnValue,
            retrieveReturnValue: retrieveReturnValue!,
          };
        };

        it("Returns CLIENT cookie value", () => {
          const { retrieveReturnValue } = fourthSetup();

          expect(retrieveReturnValue).toBe("SomeOtherValue");
        });

        it("Doesn't warn user", () => {
          const { logger } = fourthSetup();

          expect(logger.warn).not.toHaveBeenCalled();
        });
      });
    });

    describe("And we call retrieve inside useLayoutEffect", () => {
      const fourthSetup = () => {
        const cookiesInClient = {
          SomeCookie: JSON.stringify("SomeOtherValue"),
        };

        const thirdSetupReturnValue = secondSetup({
          cookiesInClient,
          cookiesInServer: null,
        });

        const { useCookie, key } = thirdSetupReturnValue;

        let retrieveReturnValue: string;
        const Component = () => {
          const { retrieve } = useCookie<string>(key);

          useLayoutEffect(() => {
            retrieveReturnValue = retrieve() as string;
          }, []);

          return <></>;
        };

        render(<Component />);

        return {
          ...thirdSetupReturnValue,
          retrieveReturnValue: retrieveReturnValue!,
        };
      };

      it("Returns CLIENT cookie", () => {
        const { retrieveReturnValue } = fourthSetup();

        expect(retrieveReturnValue).toBe("SomeOtherValue");
      });
    });

    describe("And we call retrieve inside useEffect", () => {
      const fourthSetup = () => {
        const cookiesInClient = {
          SomeCookie: JSON.stringify("SomeOtherValue"),
        };

        const thirdSetupReturnValue = secondSetup({
          cookiesInClient,
          cookiesInServer: null,
        });

        const { useCookie, key } = thirdSetupReturnValue;

        let retrieveReturnValue: string;
        const Component = () => {
          const { retrieve } = useCookie<string>(key);

          useEffect(() => {
            retrieveReturnValue = retrieve() as string;
          }, []);

          return <></>;
        };

        render(<Component />);

        return {
          ...thirdSetupReturnValue,
          retrieveReturnValue: retrieveReturnValue!,
        };
      };

      it("Returns CLIENT cookie", () => {
        const { retrieveReturnValue } = fourthSetup();

        expect(retrieveReturnValue).toBe("SomeOtherValue");
      });
    });
  });

  describe("When calling store", () => {
    const secondSetup = () => {
      const isHydratingRef = {
        current: true,
      };

      const setupReturnValue = setup({
        cookiesInClient: {},
        cookiesInServer: null,
        isHydratingRef,
      });

      const { key, useCookie } = setupReturnValue;

      const { result } = renderHook(() => useCookie(key));

      const storedValue = "SomeOtherValue";
      result.current.store(storedValue);

      return {
        ...setupReturnValue,
        storedValue,
      };
    };

    it("Sets cookie", () => {
      const { Cookies, key, storedValue } = secondSetup();

      expect(Cookies.set).toHaveBeenCalledTimes(1);
      expect(Cookies.set).toHaveBeenNthCalledWith(
        1,
        key,
        JSON.stringify(storedValue),
        undefined
      );
    });
  });

  describe("When calling clear", () => {
    const secondSetup = () => {
      const isHydratingRef = {
        current: true,
      };

      const setupReturnValue = setup({
        cookiesInClient: {},
        cookiesInServer: null,
        isHydratingRef,
      });

      const { key, useCookie } = setupReturnValue;

      const { result } = renderHook(() => useCookie(key));

      result.current.clear();

      return {
        ...setupReturnValue,
      };
    };

    it("Removes cookie", () => {
      const { Cookies } = secondSetup();

      expect(Cookies.remove).toHaveBeenCalledTimes(1);
    });
  });
});
