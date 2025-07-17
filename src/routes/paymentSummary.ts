import { FastifyPluginAsync } from 'fastify';

const paymentSummaryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/payment-summary', async (_request, reply) => {
    // Example static response (replace with real aggregation logic)
    reply.send({
      totalProcessed: 150,
      fromPrimary: 120,
      fromFallback: 30,
      totalFees: 640.0,
    });
  });
};

export default paymentSummaryRoutes;