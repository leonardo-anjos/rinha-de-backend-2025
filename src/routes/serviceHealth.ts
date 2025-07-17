import { FastifyPluginAsync } from 'fastify';
import { getFailureStats } from '../services/circuitBreaker';

const serviceHealthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/payments/service-health', async (_request, reply) => {
    const stats = getFailureStats();

    return reply.status(200).send({
      failing: stats.failures >= 3, // indicando se está falhando de verdade
      lastFailure: stats.lastFail,  // timestamp da última falha
      totalFailures: stats.failures, // total de falhas contabilizadas
    });
  });
};

export default serviceHealthRoutes;
