import { calculateFee } from '../utils/feeCalculator';
import { FALLBACK_FEE_RATE } from '../utils/config';

export const processFallback = async (amount: number): Promise<{ success: boolean; netAmount: number }> => {
  const fee = calculateFee(amount, FALLBACK_FEE_RATE);
  await new Promise((r) => setTimeout(r, 500));
  return { success: true, netAmount: amount - fee };
};