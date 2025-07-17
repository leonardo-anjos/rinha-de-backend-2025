import { calculateFee } from '../utils/feeCalculator';
import { PRIMARY_FEE_RATE } from '../utils/config';

export const processPrimary = async (amount: number): Promise<{ success: boolean; netAmount: number }> => {
  const delay = Math.random() * 1500;
  await new Promise((r) => setTimeout(r, delay));
  if (Math.random() < 0.2) throw new Error('Primary processor failure');

  const fee = calculateFee(amount, PRIMARY_FEE_RATE);
  return { success: true, netAmount: amount - fee };
};