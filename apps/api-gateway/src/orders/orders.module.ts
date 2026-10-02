import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { ClientsModule, ORDER_SERVICE_PROVIDER } from '@repo/common';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [ClientsModule.registerAsync([ORDER_SERVICE_PROVIDER])],
})
export class OrdersModule {}
