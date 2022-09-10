import { renderHook } from "@testing-library/react";
import React, { ReactNode } from "react";
import { CookiesInServerProvider } from "../components/CookiesInServerProvider";
import { useCookiesInServer } from "./useCookiesInServer";

describe("When CookiesInServerProvider is missing", () => {
  const setup = () => {
    renderHook(() => useCookiesInServer());
  };

  it("Throws an error", () => {
    expect(() => setup()).toThrow();
  });
});

describe("When CookiesInServerProvider is present", () => {
  const setup = () => {
    const isHydratingRef = {
      current: true,
    };

    const cookiesInServer = {
      firstCookie: "firstCookie",
      secondCookie: "secondCookie",
    };

    const Wrapper = ({ children }: { children: ReactNode }) => {
      return (
        <CookiesInServerProvider
          cookiesInServer={cookiesInServer}
          isHydratingRef={isHydratingRef}
        >
          {children}
        </CookiesInServerProvider>
      );
    };

    const renderHookReturnValue = renderHook(() => useCookiesInServer(), {
      wrapper: Wrapper,
    });

    return {
      isHydratingRef,
      cookiesInServer,
      renderHookReturnValue,
    };
  };

  it("Returns context value", () => {
    const { cookiesInServer, isHydratingRef, renderHookReturnValue } = setup();

    expect(renderHookReturnValue.result.current.cookiesInServer).toStrictEqual(
      cookiesInServer
    );
    expect(renderHookReturnValue.result.current.isHydratingRef).toStrictEqual(
      isHydratingRef
    );
  });
});
