import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { EXCHANGE, QUEUES, RabbitMqExceptionFilter, Transport, type MicroserviceOptions } from '@repo/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL!],
        queue: QUEUES.USERS,
        noAck: false,
        wildcards: true,
        exchange: EXCHANGE,
        exchangeType: 'topic',
        queueOptions: {
          durable: true,
        },
      },
    },
  );
  app.useGlobalFilters(new RabbitMqExceptionFilter());
  await app.listen();
}
await bootstrap();
