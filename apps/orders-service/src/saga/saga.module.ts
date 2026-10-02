import { forwardRef, Module } from '@nestjs/common';
import { SagaService } from './saga.service.js';
import { OrderSagaOrchestrator } from './saga.orchestrator.js';
import { OrdersModule } from '../orders/orders.module.js';
import { SagaTimeoutJob } from './saga.timeout.job.js';
import { SagaController } from './saga.controller.js';

@Module({
  imports: [forwardRef(() => OrdersModule)],
  providers: [SagaService, OrderSagaOrchestrator, SagaTimeoutJob],
  exports: [OrderSagaOrchestrator],
  controllers: [SagaController],
})
export class SagaModule {}
