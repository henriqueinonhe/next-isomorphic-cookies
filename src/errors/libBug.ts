import { logger } from "../utils/logger";

export const libBug = (message: string) => {
  const errorMessage = `${message}\nThis is a bug!\nPlease report it at: https://github.com/henriqueinonhe/rescope.git.`;

  logger.error(errorMessage);
  throw new Error(errorMessage);
};
