import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { ClientsModule, PAYMENT_PUBLISHER_PROVIDER } from '@repo/common';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService],
  imports: [ClientsModule.registerAsync([PAYMENT_PUBLISHER_PROVIDER])],
})
export class PaymentsModule {}
