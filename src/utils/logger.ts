const devLogger = {
  error: console.error,
  warn: console.warn,
  log: console.log,
  info: console.info,
};

const prodLogger = {
  error: () => undefined,
  warn: () => undefined,
  log: () => undefined,
  info: () => undefined,
};

export const logger =
  process.env.NODE_ENV === "production" ? prodLogger : devLogger;
