import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { OrdersModule } from './orders/orders.module.js';
import { ConfigModule, rabbitmqConfig } from '@repo/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SagaModule } from './saga/saga.module.js';
import { ClientsProviderModule } from './client-provider/client-provider.module.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    OrdersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rabbitmqConfig],
    }),
    ScheduleModule.forRoot(),
    ClientsProviderModule,
    PrismaModule,
    SagaModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
