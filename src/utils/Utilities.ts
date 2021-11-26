/**
 * Utilities
 */

import { EnvironmentMissingError } from "../helpers/Errors";

export function getEnv(
  key: string,
  abortIfFail: boolean = true
): string | undefined {
  const value = process.env[key];

  if (value) {
    return value;
  } else {
    if (abortIfFail)
      throw new EnvironmentMissingError(`Environment ${key} is undefined`);
    else return undefined;
  }
}
