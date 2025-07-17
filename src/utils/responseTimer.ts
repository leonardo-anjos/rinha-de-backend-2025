export const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> => {
  const start = Date.now();
  const result = await fn();
  return { result, time: Date.now() - start };
};
