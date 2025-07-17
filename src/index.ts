import Fastify from 'fastify';
import paymentRoutes from './routes/payment';
import paymentSummaryRoutes from './routes/paymentSummary';
import serviceHealthRoutes from './routes/serviceHealth';
import logger from './plugins/logger';
import prismaPlugin from './plugins/prisma'

const app = Fastify({ logger });

app.register(prismaPlugin)

app.register(paymentRoutes);
app.register(paymentSummaryRoutes);
app.register(serviceHealthRoutes);

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    app.log.info('Server Started');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();