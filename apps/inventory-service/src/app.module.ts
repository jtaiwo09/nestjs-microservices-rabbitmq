import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule, rabbitmqConfig } from '@repo/config';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rabbitmqConfig],
    }),
    InventoryModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
