import { forwardRef, Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { SagaModule } from '../saga/saga.module.js';

@Module({
  imports: [forwardRef(() => SagaModule)],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
