export const processFallback = async (amount: number): Promise<{ success: boolean; netAmount: number }> => {
  const fee = amount * 0.15;
  await new Promise((r) => setTimeout(r, 500));
  return { success: true, netAmount: amount - fee };
};