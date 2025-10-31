export const isValueOf = <T extends Record<string, string | number>>(
  obj: T,
  value: unknown,
): value is T[keyof T] => {
  return Object.values(obj).includes(value as T[keyof T]);
};
