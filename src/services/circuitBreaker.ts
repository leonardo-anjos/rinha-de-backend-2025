import { PAYMENT_PROCESSOR_PRIMARY_HEALTH_URL, PAYMENT_PROCESSOR_FALLBACK_HEALTH_URL } from '../utils/config';

interface CircuitBreakerState {
  failures: number;
  lastFail: number;
}

const circuitBreakers: Record<string, CircuitBreakerState> = {
  primary: { failures: 0, lastFail: 0 },
  fallback: { failures: 0, lastFail: 0 },
};

export const recordFailure = (processor: 'primary' | 'fallback') => {
  circuitBreakers[processor].failures++;
  circuitBreakers[processor].lastFail = Date.now();
};

export const shouldUseCircuitBreaker = (processor: 'primary' | 'fallback') => {
  return circuitBreakers[processor].failures >= 3 && Date.now() - circuitBreakers[processor].lastFail < 30000;
};

export const resetFailures = (processor: 'primary' | 'fallback') => {
  circuitBreakers[processor].failures = 0;
};

export const getFailureStats = (processor: 'primary' | 'fallback') => {
  return { ...circuitBreakers[processor] };
};

type HealthStatus = {
  healthy: boolean;
  minResponseTimeMs: number;
  lastChecked: number;
  lastResult: boolean;
};

const healthCache: Record<string, HealthStatus> = {
  primary: { healthy: true, minResponseTimeMs: 0, lastChecked: 0, lastResult: true },
  fallback: { healthy: true, minResponseTimeMs: 0, lastChecked: 0, lastResult: true },
};

const processorHealthUrls: Record<string, string> = {
  primary: PAYMENT_PROCESSOR_PRIMARY_HEALTH_URL,
  fallback: PAYMENT_PROCESSOR_FALLBACK_HEALTH_URL,
};

export const getProcessorHealth = async (processor: 'primary' | 'fallback'): Promise<HealthStatus> => {
  const now = Date.now();
  const cache = healthCache[processor];
  if (now - cache.lastChecked < 5000) {
    return cache;
  }
  try {
    const res = await fetch(processorHealthUrls[processor]);
    if (!res.ok) {
      cache.healthy = false;
      cache.lastResult = false;
      cache.lastChecked = now;
      return cache;
    }
    const data = await res.json();
    cache.healthy = !(data as any).failing;
    cache.minResponseTimeMs = (data as any).minResponseTimeMs || 0;
    cache.lastResult = cache.healthy;
    cache.lastChecked = now;
    return cache;
  } catch (e) {
    cache.healthy = false;
    cache.lastResult = false;
    cache.lastChecked = now;
    return cache;
  }
};