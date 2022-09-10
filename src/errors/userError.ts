import { logger } from "../utils/logger";

export const userError = (message: string) => {
  const errorMessage = `${message}`;

  logger.error(errorMessage);
  throw new Error(errorMessage);
};
