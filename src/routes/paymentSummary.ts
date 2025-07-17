import { FastifyPluginAsync } from 'fastify';

const paymentSummaryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/payment-summary', async (request, reply) => {
    const payments = await fastify.prisma.payment.findMany();

    const totalProcessed = payments.length;
    const fromPrimary = payments.filter((p: any) => p.method === 'primary').length;
    const fromFallback = payments.filter((p: any) => p.method === 'fallback').length;
    const totalFees = payments.reduce((acc: number, p: any) => acc + Number(p.fee), 0);

    const summary = {
      totalProcessed,
      fromPrimary,
      fromFallback,
      totalFees,
    };

    return reply.status(200).send(summary);
  });
};

export default paymentSummaryRoutes;
