export const processPrimary = async (amount: number): Promise<{ success: boolean; netAmount: number }> => {
  // Simulate delay and random failure
  const delay = Math.random() * 1500;
  await new Promise((r) => setTimeout(r, delay));
  if (Math.random() < 0.2) throw new Error('Primary processor failure');

  const fee = amount * 0.05;
  return { success: true, netAmount: amount - fee };
};