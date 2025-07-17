import { DEFAULT_PRIMARY_FEE_RATE, DEFAULT_FALLBACK_FEE_RATE } from './feeCalculator';

export const PRIMARY_FEE_RATE = process.env.PRIMARY_FEE_RATE ? parseFloat(process.env.PRIMARY_FEE_RATE) : DEFAULT_PRIMARY_FEE_RATE;
export const FALLBACK_FEE_RATE = process.env.FALLBACK_FEE_RATE ? parseFloat(process.env.FALLBACK_FEE_RATE) : DEFAULT_FALLBACK_FEE_RATE;

export const PAYMENT_PROCESSOR_PRIMARY_HEALTH_URL = process.env.PAYMENT_PROCESSOR_PRIMARY_HEALTH_URL || 'http://localhost:4000/payments/service-health';
export const PAYMENT_PROCESSOR_FALLBACK_HEALTH_URL = process.env.PAYMENT_PROCESSOR_FALLBACK_HEALTH_URL || 'http://localhost:4001/payments/service-health'; 