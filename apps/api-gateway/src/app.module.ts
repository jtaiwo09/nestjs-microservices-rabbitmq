import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnv, ConfigModule, rabbitmqConfig } from '@repo/config';
import { OrdersModule } from './orders/orders.module.js';
import { AuthModule } from './auth/auth.module.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { appConfig } from './configs/app.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // validate: validateEnv,
      load: [rabbitmqConfig, appConfig],
    }),
    AuthModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
