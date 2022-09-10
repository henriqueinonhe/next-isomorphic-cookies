export const devLogger = {
  error: console.error,
  warn: console.warn,
  log: console.log,
  info: console.info,
};

export const prodLogger = {
  error: () => undefined,
  warn: () => undefined,
  log: () => undefined,
  info: () => undefined,
};

export type Logger = {
  error: typeof console.error;
  warn: typeof console.warn;
  log: typeof console.log;
  info: typeof console.info;
};
