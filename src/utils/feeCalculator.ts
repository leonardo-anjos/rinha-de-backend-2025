export const calculateFee = (amount: number, rate: number): number => {
  return amount * rate;
};

export const DEFAULT_PRIMARY_FEE_RATE = 0.05;
export const DEFAULT_FALLBACK_FEE_RATE = 0.15;