import { makeUseClientSideCookie, makeUseServerSideCookie } from "./useCookie";
import { UseCookiesInServer } from "./useCookiesInServer";
import {
  makeUseClientSideCookieState,
  makeUseServerSideCookieState,
} from "./useCookieState";
import { act, render, renderHook } from "@testing-library/react";
import { Cookies } from "../cookies/Cookies";
import { Logger } from "../utils/logger";
import { useLayoutEffect, useRef } from "react";
import { makeUseSyncWithCookie } from "./useSyncWithCookie";
import React from "react";

describe("When in the server", () => {
  type SetupParameters = {
    cookiesInServer: Record<string, string> | null;
  };

  const setup = ({ cookiesInServer }: SetupParameters) => {
    const isHydratingRef = {
      current: true,
    };

    const useCookiesInServer: UseCookiesInServer = () => ({
      cookiesInServer,
      isHydratingRef,
    });

    const useCookie = makeUseServerSideCookie({
      useCookiesInServer,
    });

    const useCookieState = makeUseServerSideCookieState({
      useCookie,
    });

    const key = "SomeCookie";

    const initializer = jest
      .fn()
      .mockImplementation(
        (cookieState: string | undefined) =>
          cookieState?.toUpperCase() ?? "Initial Value"
      );

    const renderHookReturnValue = renderHook(() =>
      useCookieState(key, initializer)
    );

    return {
      initializer,
      renderHookReturnValue,
    };
  };

  describe("And there are cookies in server", () => {
    const secondSetup = () =>
      setup({
        cookiesInServer: {
          SomeCookie: JSON.stringify("Some Value"),
        },
      });

    it("Initializer receives server cookie value", () => {
      const { initializer } = secondSetup();

      expect(initializer).toHaveBeenNthCalledWith(1, "Some Value");
    });

    it("State is initialized using initializer, that receives server cookie value to do so", () => {
      const { renderHookReturnValue } = secondSetup();

      expect(renderHookReturnValue.result.current.value).toBe("SOME VALUE");
    });

    describe("And retrieve is called", () => {
      const thirdSetup = () => {
        const secondSetupReturnValue = secondSetup();
        const { renderHookReturnValue } = secondSetupReturnValue;

        act(() => {
          renderHookReturnValue.result.current.retrieve();
        });

        return { ...secondSetupReturnValue };
      };

      it("Value is set to server cookie", () => {
        const { renderHookReturnValue } = thirdSetup();

        expect(renderHookReturnValue.result.current.value).toBe("Some Value");
      });
    });
  });

  describe("And there are NO cookies in server", () => {
    const secondSetup = () =>
      setup({
        cookiesInServer: null,
      });

    it("Initializer receives undefined", () => {
      const { initializer } = secondSetup();

      expect(initializer).toHaveBeenNthCalledWith(1, undefined);
    });

    it("State is initialized using initializer, that receives server undefined to do so", () => {
      const { renderHookReturnValue } = secondSetup();

      expect(renderHookReturnValue.result.current.value).toBe("Initial Value");
    });

    describe("And retrieve is called", () => {
      const thirdSetup = () => {
        const secondSetupReturnValue = secondSetup();
        const { renderHookReturnValue } = secondSetupReturnValue;

        act(() => {
          renderHookReturnValue.result.current.retrieve();
        });

        return secondSetupReturnValue;
      };

      it("Initializer is used to set the value, receiving undefined to do so", () => {
        const { initializer, renderHookReturnValue } = thirdSetup();

        expect(initializer).toHaveBeenNthCalledWith(2, undefined);
        expect(renderHookReturnValue.result.current.value).toBe(
          "Initial Value"
        );
      });
    });
  });

  describe("And we call store after modifying state", () => {
    const secondSetup = () => {
      const setupReturnValue = setup({
        cookiesInServer: { SomeCookie: JSON.stringify("Some Value") },
      });
      const { renderHookReturnValue } = setupReturnValue;

      act(() => {
        renderHookReturnValue.result.current.setValue("Some New Value");
      });

      act(() => {
        renderHookReturnValue.result.current.store();
      });

      return setupReturnValue;
    };

    it("No op", () => {
      const { renderHookReturnValue } = secondSetup();

      expect(renderHookReturnValue.result.current.value).toBe("Some New Value");
    });
  });

  describe("And we call clear", () => {
    const secondSetup = () => {
      const setupReturnValue = setup({
        cookiesInServer: { SomeCookie: JSON.stringify("Some Value") },
      });
      const { renderHookReturnValue } = setupReturnValue;

      act(() => {
        renderHookReturnValue.result.current.clear();
      });

      return setupReturnValue;
    };

    it("Value is set by calling initializer with undefined", () => {
      const { initializer, renderHookReturnValue } = secondSetup();

      expect(initializer).toHaveBeenNthCalledWith(2, undefined);
      expect(renderHookReturnValue.result.current.value).toBe("Initial Value");
    });
  });
});

describe("When in the client", () => {
  type SetupParameters = {
    isHydratingRef: { current: boolean };
    cookiesInServer: Record<string, string> | null;
  };

  const setup = ({ isHydratingRef, cookiesInServer }: SetupParameters) => {
    const cookiesInClient: Record<string, string> = {
      SomeCookie: JSON.stringify("Cookie Client Value"),
    };

    const Cookies = {
      get: jest.fn().mockImplementation((key: string) => cookiesInClient[key]),
      set: jest.fn(),
      remove: jest.fn(),
    } as unknown as Cookies;

    const logger = {
      warn: jest.fn(),
    } as unknown as Logger;

    const useIsomorphicLayoutEffect = useLayoutEffect;

    const useCookiesInServer: UseCookiesInServer = () => ({
      cookiesInServer,
      isHydratingRef,
    });

    const useCookie = makeUseClientSideCookie({
      Cookies,
      logger,
      useIsomorphicLayoutEffect,
      useCookiesInServer,
    });

    const useSyncWithCookie = makeUseSyncWithCookie({
      useCookie,
      useIsomorphicLayoutEffect,
    });

    const useCookieState = makeUseClientSideCookieState({
      useCookie,
      useSyncWithCookie,
    });

    const key = "SomeCookie";

    const initializer = jest
      .fn()
      .mockImplementation(
        (cookieState: string | undefined) =>
          cookieState?.toUpperCase() ?? "Initial Value"
      );

    return {
      initializer,
      useCookieState,
      Cookies,
      key,
    };
  };

  describe("And it is hydrating", () => {
    type SecondSetupParameters = Pick<SetupParameters, "cookiesInServer">;

    const secondSetup = ({ cookiesInServer }: SecondSetupParameters) =>
      setup({
        cookiesInServer,
        isHydratingRef: {
          current: true,
        },
      });

    describe("And there are cookies in server", () => {
      const thirdSetup = () => {
        const cookiesInServer = {
          SomeCookie: JSON.stringify("Server Value"),
        };

        const secondSetupReturnValue = secondSetup({ cookiesInServer });

        return {
          ...secondSetupReturnValue,
        };
      };

      it("State is initialized by calling initializer with server cookie value", () => {
        const { initializer, useCookieState, key } = thirdSetup();

        const { result } = renderHook(() => useCookieState(key, initializer));

        expect(initializer).toHaveBeenNthCalledWith(1, "Server Value");
        expect(result.current.value).toBe("SERVER VALUE");
      });

      describe("And we call retrieve without a serializer during hydration", () => {
        const fourthSetup = () => {
          const thirdSetupReturnValue = thirdSetup();
          const { useCookieState, initializer, key } = thirdSetupReturnValue;

          const valueProbe: Array<unknown> = [];
          const Component = () => {
            const { value, retrieve } = useCookieState(key, initializer);

            valueProbe.push(value);

            const isInitializedRef = useRef(false);
            if (!isInitializedRef.current) {
              retrieve();
              isInitializedRef.current = true;
            }

            return <></>;
          };

          render(<Component />);

          return { ...thirdSetupReturnValue, valueProbe };
        };

        it("Sets state to server cookie", () => {
          const { valueProbe } = fourthSetup();

          expect(valueProbe[1]).toBe("Server Value");
        });
      });
    });

    describe("And there are NO cookies in server", () => {
      const thirdSetup = () =>
        secondSetup({
          cookiesInServer: null,
        });

      it("State is initialized by calling initializer with undefined", () => {
        const { useCookieState, key, initializer } = thirdSetup();

        let initialValueProbe;

        const Component = () => {
          const { value } = useCookieState(key, initializer);

          const isInitializedRef = useRef(false);

          if (!isInitializedRef.current) {
            initialValueProbe = value;
            isInitializedRef.current = true;
          }

          return <></>;
        };

        render(<Component />);

        expect(initialValueProbe).toBe("Initial Value");
      });

      describe("And we call retrieve without a serializer during hydration", () => {
        const fourthSetup = () => {
          const thirdSetupReturnValue = thirdSetup();
          const { useCookieState, initializer, key } = thirdSetupReturnValue;

          const valueProbe: Array<unknown> = [];
          const Component = () => {
            const { value, retrieve } = useCookieState(key, initializer);

            valueProbe.push(value);

            const isInitializedRef = useRef(false);
            if (!isInitializedRef.current) {
              retrieve();
              isInitializedRef.current = true;
            }

            return <></>;
          };

          render(<Component />);

          return { ...thirdSetupReturnValue, valueProbe };
        };

        it("Sets state to value obtained from calling initializer with undefined", () => {
          const { valueProbe } = fourthSetup();

          expect(valueProbe[1]).toBe("Initial Value");
        });
      });
    });
  });

  describe("And it is NOT hydrating", () => {
    type SecondSetupParameters = Pick<SetupParameters, "cookiesInServer">;

    const secondSetup = ({ cookiesInServer }: SecondSetupParameters) => {
      const setupReturnValue = setup({
        cookiesInServer,
        isHydratingRef: {
          current: false,
        },
      });

      return setupReturnValue;
    };

    it("State is initialized by calling initializer with client cookie value", () => {
      const { initializer, key, useCookieState } = secondSetup({
        cookiesInServer: null,
      });

      const valueProbe: Array<unknown> = [];

      const Component = () => {
        const { value } = useCookieState(key, initializer);

        valueProbe.push(value);

        return <></>;
      };

      render(<Component />);

      expect(valueProbe[0]).toBe("COOKIE CLIENT VALUE");
    });

    describe("And we call retrieve without a serializer after setting state", () => {
      const thirdSetup = () => {
        const secondSetupReturnValue = secondSetup({
          cookiesInServer: null,
        });
        const { useCookieState, key, initializer } = secondSetupReturnValue;

        const renderHookReturnValue = renderHook(() =>
          useCookieState(key, initializer)
        );

        act(() => {
          renderHookReturnValue.result.current.setValue("Some Other Value");
        });

        act(() => {
          renderHookReturnValue.result.current.retrieve();
        });

        return {
          ...secondSetupReturnValue,
          renderHookReturnValue,
        };
      };

      it("Sets state to client cookie", () => {
        const { renderHookReturnValue } = thirdSetup();

        expect(renderHookReturnValue.result.current.value).toBe(
          "Cookie Client Value"
        );
      });
    });
  });

  describe("And we call retrieve with a deserializer", () => {
    const secondSetup = () => {
      const isHydratingRef = {
        current: false,
      };

      const setupReturnValue = setup({
        cookiesInServer: {
          SomeCookie: JSON.stringify("Some Value"),
        },
        isHydratingRef,
      });
      const { initializer, key, useCookieState } = setupReturnValue;

      const deserializer = (value: string) => value.toLowerCase();

      const renderHookReturnValue = renderHook(() =>
        useCookieState(key, initializer)
      );

      act(() => {
        renderHookReturnValue.result.current.retrieve({
          deserializer,
        });
      });

      return {
        ...setupReturnValue,
        renderHookReturnValue,
      };
    };

    it("Sets value to the value returned by the deserializer called with cookie value", () => {
      const { renderHookReturnValue } = secondSetup();

      expect(renderHookReturnValue.result.current.value).toBe(
        "cookie client value"
      );
    });
  });

  describe("And we call store", () => {
    const secondSetup = () => {
      const isHydratingRef = {
        current: false,
      };

      const setupReturnValue = setup({
        cookiesInServer: {
          SomeCookie: JSON.stringify("Some Value"),
        },
        isHydratingRef,
      });
      const { initializer, key, useCookieState } = setupReturnValue;

      const renderHookReturnValue = renderHook(() =>
        useCookieState(key, initializer)
      );

      act(() => {
        renderHookReturnValue.result.current.store(
          renderHookReturnValue.result.current.value
        );
      });

      return {
        ...setupReturnValue,
        renderHookReturnValue,
      };
    };

    it("Stores value", () => {
      const { Cookies, key } = secondSetup();

      expect(Cookies.set).toHaveBeenNthCalledWith(
        1,
        key,
        JSON.stringify("COOKIE CLIENT VALUE"),
        undefined
      );
    });
  });

  describe("And we call clear", () => {
    const secondSetup = () => {
      const isHydratingRef = {
        current: false,
      };

      const setupReturnValue = setup({
        cookiesInServer: {
          SomeCookie: JSON.stringify("Some Value"),
        },
        isHydratingRef,
      });
      const { initializer, key, useCookieState } = setupReturnValue;

      const renderHookReturnValue = renderHook(() =>
        useCookieState(key, initializer)
      );

      act(() => {
        renderHookReturnValue.result.current.clear();
      });

      return {
        ...setupReturnValue,
        renderHookReturnValue,
      };
    };

    it("Removes cookie", () => {
      const { Cookies, key } = secondSetup();

      expect(Cookies.remove).toHaveBeenNthCalledWith(1, key);
    });

    it("Uses initializer to set new value, by passing undefined to it", () => {
      const { renderHookReturnValue } = secondSetup();

      expect(renderHookReturnValue.result.current.value).toBe("Initial Value");
    });
  });

  describe("And we're using the default storeOnSet", () => {
    const secondSetup = () => {
      const isHydratingRef = {
        current: false,
      };

      const setupReturnValue = setup({
        isHydratingRef,
        cookiesInServer: null,
      });

      const { key, initializer, useCookieState } = setupReturnValue;

      const renderHookReturnValue = renderHook(() =>
        useCookieState(key, initializer)
      );

      return {
        ...setupReturnValue,
        renderHookReturnValue,
      };
    };

    describe("And we call setValue", () => {
      const thirdSetup = () => {
        const secondSetupReturnValue = secondSetup();
        const { renderHookReturnValue } = secondSetupReturnValue;

        const valuePassedToSetter = "Some New Value";

        act(() => {
          renderHookReturnValue.result.current.setValue(valuePassedToSetter);
        });

        return {
          ...secondSetupReturnValue,
          valuePassedToSetter,
        };
      };

      it("Sets value", () => {
        const { renderHookReturnValue, valuePassedToSetter } = thirdSetup();

        expect(renderHookReturnValue.result.current.value).toBe(
          valuePassedToSetter
        );
      });

      it("Stores value with identity function as serializer", () => {
        const { valuePassedToSetter, Cookies, key } = thirdSetup();

        expect(Cookies.set).toHaveBeenNthCalledWith(
          1,
          key,
          JSON.stringify(valuePassedToSetter),
          {}
        );
      });
    });
  });

  describe("And storeOnSet is false", () => {
    const secondSetup = () => {
      const isHydratingRef = {
        current: false,
      };

      const setupReturnValue = setup({
        isHydratingRef,
        cookiesInServer: null,
      });

      const { key, initializer, useCookieState } = setupReturnValue;

      const renderHookReturnValue = renderHook(() =>
        useCookieState(key, initializer, {
          storeOnSet: false,
        })
      );

      return {
        ...setupReturnValue,
        renderHookReturnValue,
      };
    };

    describe("And we call setValue", () => {
      const thirdSetup = () => {
        const secondSetupReturnValue = secondSetup();
        const { renderHookReturnValue } = secondSetupReturnValue;

        const valuePassedToSetter = "Some New Value";

        act(() => {
          renderHookReturnValue.result.current.setValue(valuePassedToSetter);
        });

        return {
          ...secondSetupReturnValue,
          valuePassedToSetter,
        };
      };

      it("Sets value", () => {
        const { renderHookReturnValue, valuePassedToSetter } = thirdSetup();

        expect(renderHookReturnValue.result.current.value).toBe(
          valuePassedToSetter
        );
      });

      it("Doesn't store value", () => {
        const { valuePassedToSetter, Cookies, key } = thirdSetup();

        expect(Cookies.set).not.toHaveBeenCalled();
      });
    });
  });

  describe("And storeOnSet is an object with a custom serializer", () => {
    const secondSetup = () => {
      const isHydratingRef = {
        current: false,
      };

      const setupReturnValue = setup({
        isHydratingRef,
        cookiesInServer: null,
      });

      const { key, initializer, useCookieState } = setupReturnValue;

      const serializer = (string: string) => string.toUpperCase();

      const renderHookReturnValue = renderHook(() =>
        useCookieState(key, initializer, {
          storeOnSet: {
            serializer,
          },
        })
      );

      return {
        ...setupReturnValue,
        renderHookReturnValue,
        serializer,
      };
    };

    describe("And we call setValue", () => {
      const thirdSetup = () => {
        const secondSetupReturnValue = secondSetup();
        const { renderHookReturnValue } = secondSetupReturnValue;

        const valuePassedToSetter = "Some New Value";

        act(() => {
          renderHookReturnValue.result.current.setValue(valuePassedToSetter);
        });

        return {
          ...secondSetupReturnValue,
          valuePassedToSetter,
        };
      };

      it("Sets value", () => {
        const { renderHookReturnValue, valuePassedToSetter } = thirdSetup();

        expect(renderHookReturnValue.result.current.value).toBe(
          valuePassedToSetter
        );
      });

      it("Stores value transformed by serializer", () => {
        const { valuePassedToSetter, Cookies, key, serializer } = thirdSetup();

        expect(Cookies.set).toHaveBeenNthCalledWith(
          1,
          key,
          JSON.stringify(serializer(valuePassedToSetter)),
          {}
        );
      });
    });
  });
});
