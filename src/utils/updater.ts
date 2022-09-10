export type Updater<T> = DataUpdater<T> | FunctionUpdater<T>;

export type DataUpdater<T> = T;

export type FunctionUpdater<T> = (currentState: T) => T;

export const isFunctionUpdater = <T>(
  updater: Updater<T>
): updater is FunctionUpdater<T> => typeof updater === "function";

export const updatedValueFromUpdater = <T>(
  currentState: T,
  updater: Updater<T>
) => {
  if (isFunctionUpdater(updater)) {
    return updater(currentState);
  }

  return updater;
};
