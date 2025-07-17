import { FastifyPluginAsync } from 'fastify';
import { processPrimary } from '../services/primaryProcessor';
import { processFallback } from '../services/fallbackProcessor';
import { recordFailure, resetFailures, shouldUseCircuitBreaker, getProcessorHealth } from '../services/circuitBreaker';
import { measureTime } from '../utils/responseTimer';

interface PaymentRequest {
  amount: number;
  correlationId: string;
}

interface PaymentResponse {
  correlationId: string;
  amount: number;
  netAmount: number;
  usedFallback: boolean;
  processingTimeMs: number;
}

const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/payments', async (request, reply) => {
    const { amount, correlationId } = request.body as PaymentRequest;

    let usedFallback = false;
    let netAmount = 0;
    let fee = 0;
    let method = '';

    try {
      const primaryHealth = await getProcessorHealth('primary');
      const primaryBreaker = shouldUseCircuitBreaker('primary');

      if (!primaryHealth.healthy || primaryBreaker) {
        // Se primário indisponível, tenta fallback
        usedFallback = true;
        method = 'fallback';
        const fallbackHealth = await getProcessorHealth('fallback');
        const fallbackBreaker = shouldUseCircuitBreaker('fallback');
        if (!fallbackHealth.healthy || fallbackBreaker) {
          // Ambos indisponíveis
          return reply.status(503).send({ error: 'No payment processor available' });
        }
        // Processa com fallback
        const { result, time } = await measureTime(async () => {
          try {
            const res = await processFallback(amount);
            fee = amount - res.netAmount;
            resetFailures('fallback');
            return res;
          } catch (e) {
            recordFailure('fallback');
            throw e;
          }
        });
        netAmount = result.netAmount;
        // Persistir pagamento no banco
        await fastify.prisma.payment.create({
          data: {
            correlationId,
            amount: amount.toFixed(2),
            method,
            fee: fee.toFixed(2),
          },
        });
        return reply.status(200).send({
          correlationId,
          amount,
          netAmount,
          usedFallback,
          processingTimeMs: time,
        } as PaymentResponse);
      }

      // Se primário disponível, tenta processar
      method = 'primary';
      const { result, time } = await measureTime(async () => {
        try {
          const res = await processPrimary(amount);
          fee = amount - res.netAmount;
          resetFailures('primary');
          return res;
        } catch (e) {
          recordFailure('primary');
          throw e;
        }
      });
      netAmount = result.netAmount;
      // Persistir pagamento no banco
      await fastify.prisma.payment.create({
        data: {
          correlationId,
          amount: amount.toFixed(2),
          method,
          fee: fee.toFixed(2),
        },
      });
      return reply.status(200).send({
        correlationId,
        amount,
        netAmount,
        usedFallback,
        processingTimeMs: time,
      } as PaymentResponse);
    } catch (error) {
      // Se falhou no primário, tenta fallback se possível
      try {
        const fallbackHealth = await getProcessorHealth('fallback');
        const fallbackBreaker = shouldUseCircuitBreaker('fallback');
        if (!fallbackHealth.healthy || fallbackBreaker) {
          return reply.status(503).send({ error: 'No payment processor available' });
        }
        usedFallback = true;
        method = 'fallback';
        const { result, time } = await measureTime(async () => {
          try {
            const res = await processFallback(amount);
            fee = amount - res.netAmount;
            resetFailures('fallback');
            return res;
          } catch (e) {
            recordFailure('fallback');
            throw e;
          }
        });
        netAmount = result.netAmount;
        // Persistir pagamento no banco
        await fastify.prisma.payment.create({
          data: {
            correlationId,
            amount: amount.toFixed(2),
            method,
            fee: fee.toFixed(2),
          },
        });
        return reply.status(200).send({
          correlationId,
          amount,
          netAmount,
          usedFallback,
          processingTimeMs: time,
        } as PaymentResponse);
      } catch (fallbackError) {
        // erro em ambos os processadores, responde com erro 503
        fastify.log.error(fallbackError);
        return reply.status(503).send({ error: 'Payment processing failed on both processors' });
      }
    }
  });
};

export default paymentRoutes;
