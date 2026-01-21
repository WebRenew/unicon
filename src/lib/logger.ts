/**
 * Development-only logger utility
 *
 * These logging functions are completely stripped from production bundles.
 * Use logger.error() and logger.warn() for production-safe error logging.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug-level logging (stripped in production)
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Info-level logging (stripped in production)
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Warning logging (kept in production for important warnings)
   */
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },

  /**
   * Error logging (kept in production for error tracking)
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
