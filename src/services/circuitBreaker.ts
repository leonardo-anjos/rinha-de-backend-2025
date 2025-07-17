let failures = 0;
let lastFail = 0;

export const recordFailure = () => {
  failures++;
  lastFail = Date.now();
};

export const shouldUseFallback = () => {
  return failures >= 3 && Date.now() - lastFail < 30000;
};

export const resetFailures = () => {
  failures = 0;
};

export const getFailureStats = () => {
  return { failures, lastFail };
};