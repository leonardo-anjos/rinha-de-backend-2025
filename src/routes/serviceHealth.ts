import { FastifyPluginAsync } from 'fastify';
import { getFailureStats } from '../services/circuitBreaker';

const serviceHealthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/payments/service-health', async (_request, reply) => {
    // Por padrão, expor o health do processador primário
    const stats = getFailureStats('primary');

    return reply.status(200).send({
      failing: stats.failures >= 3,
      lastFailure: stats.lastFail,
      totalFailures: stats.failures,
    });
  });
};

export default serviceHealthRoutes;
