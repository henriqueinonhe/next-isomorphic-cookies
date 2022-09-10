import { useEffect, useLayoutEffect } from "react";

export type UseIsomorphicLayoutEffect =
  | typeof useEffect
  | typeof useLayoutEffect;
