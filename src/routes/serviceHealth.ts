import { FastifyPluginAsync } from 'fastify';
import { getFailureStats } from '../services/circuitBreaker';

const serviceHealthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/payments/service-health', async (_req, reply) => {
    const stats = getFailureStats();
    reply.send({
      isDegraded: stats.failures >= 3,
      lastFailure: stats.lastFail,
      totalFailures: stats.failures,
    });
  });
};

export default serviceHealthRoutes;