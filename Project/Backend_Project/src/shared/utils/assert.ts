export function assertDefined<T>(value: T | null | undefined, message = 'Value is required'): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

