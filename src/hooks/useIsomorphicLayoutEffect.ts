import { useEffect, useLayoutEffect } from "react";
import { isServer } from "../utils/isServer";

export const useIsomorphicLayoutEffect = isServer()
  ? useLayoutEffect
  : useEffect;
