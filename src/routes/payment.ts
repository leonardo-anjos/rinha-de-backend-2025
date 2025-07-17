import { FastifyPluginAsync } from 'fastify';
import { processPrimary } from '../services/primaryProcessor';
import { processFallback } from '../services/fallbackProcessor';
import { recordFailure, resetFailures, shouldUseFallback } from '../services/circuitBreaker';
import { calculateFee } from '../utils/feeCalculator';
import { measureTime } from '../utils/responseTimer';

const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/payments', async (request, reply) => {
    const { amount, correlationId } = request.body as { amount: number; correlationId: string };
    let netAmount, usedFallback = false;

    const { result, time } = await measureTime(async () => {
      try {
        if (shouldUseFallback()) {
          usedFallback = true;
          return await processFallback(amount);
        } else {
          const res = await processPrimary(amount);
          resetFailures();
          return res;
        }
      } catch (e) {
        recordFailure();
        usedFallback = true;
        return await processFallback(amount);
      }
    });

    netAmount = result.netAmount;

    reply.send({ correlationId, amount, netAmount, usedFallback, processingTimeMs: time });
  });
};

export default paymentRoutes;
