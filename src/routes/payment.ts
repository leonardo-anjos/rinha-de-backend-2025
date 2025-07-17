import { FastifyPluginAsync } from 'fastify';
import { processPrimary } from '../services/primaryProcessor';
import { processFallback } from '../services/fallbackProcessor';
import { recordFailure, resetFailures, shouldUseFallback } from '../services/circuitBreaker';
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
      // Mede o tempo de processamento do pagamento
      const { result, time } = await measureTime(async () => {
        if (shouldUseFallback()) {
          usedFallback = true;
          method = 'fallback';
          const res = await processFallback(amount);
          fee = amount - res.netAmount;
          return res;
        } else {
          method = 'primary';
          const res = await processPrimary(amount);
          resetFailures(); // sucesso no primário, resetar contagem de falhas
          fee = amount - res.netAmount;
          return res;
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
      // Ao capturar erro no primário ou fallback, registrar falha
      recordFailure();
      if (!usedFallback) {
        try {
          // tenta fallback em caso de erro no primário
          const { result, time } = await measureTime(() => processFallback(amount));
          usedFallback = true;
          netAmount = result.netAmount;
          method = 'fallback';
          fee = amount - result.netAmount;

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
          // erro em ambos os processadores, responde com erro 500
          fastify.log.error(fallbackError);
          return reply.status(500).send({ error: 'Payment processing failed on both processors' });
        }
      } else {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Payment processing failed' });
      }
    }
  });
};

export default paymentRoutes;
