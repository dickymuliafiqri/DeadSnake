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

// https://stackoverflow.com/a/68394450
export function bytesForHuman(bytes: number) {
  let units = ["B", "KB", "MB", "GB", "TB", "PB"];

  let i = 0;

  for (i; bytes > 1024; i++) {
    bytes /= 1024;
  }

  return bytes.toFixed(1) + " " + units[i];
}
