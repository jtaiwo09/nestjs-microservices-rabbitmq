import { Controller, Inject } from '@nestjs/common';

import {
  ClientProxy,
  Ctx,
  EventPattern,
  INVENTORY_EVENTS,
  MessagePattern,
  Payload,
  PAYMENT_EVENTS,
  PAYMENT_PUBLISHER,
  SAGA_PATTERNS,
  type InventoryReservedEvent,
  type PaymentCompletedEvent,
  type PaymentFailedEvent,
  type ProcessPaymentCommand,
  type ProcessPaymentResult,
} from '@repo/common';
import { PaymentsService } from './payments.service.js';
import { PaymentStatus } from '../generated/prisma/enums.js';

@Controller()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,

    @Inject(PAYMENT_PUBLISHER)
    private readonly paymentClient: ClientProxy,
  ) {}

  @EventPattern(INVENTORY_EVENTS.RESERVED)
  async handleInventoryReserved(
    @Payload()
    event: InventoryReservedEvent,
    @Ctx() context: any,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      console.log(`[Payments] ${INVENTORY_EVENTS.RESERVED}: ${event.orderId}`);

      const payment = await this.paymentsService.processPayment({
        orderId: event.orderId,
        userId: event.userId,
        amount: event.totalAmount,
        currency: event.currency,
      });

      if (payment.status === PaymentStatus.FAILED) {
        this.paymentClient.emit(PAYMENT_EVENTS.FAILED, {
          orderId: event.orderId,
          userId: event.userId,
          reason: 'Payment provider rejected transaction',
          failedAt: new Date().toISOString(),
        } satisfies PaymentFailedEvent);

        channel.ack(message);

        return;
      }

      this.paymentClient.emit(PAYMENT_EVENTS.COMPLETED, {
        orderId: event.orderId,
        paymentId: payment.id,
        userId: event.userId,
        amount: Number(payment.amount),
        currency: payment.currency,
        completedAt: new Date().toISOString(),
      } satisfies PaymentCompletedEvent);

      console.log(`[Payments] ${PAYMENT_EVENTS.COMPLETED}: ${payment.status}`);

      channel.ack(message);
    } catch (error) {
      console.error(
        `[Payments] Failed processing payment for ${event.orderId}`,
        error,
      );

      throw error;
    }
  }

  @MessagePattern(SAGA_PATTERNS.PROCESS_PAYMENT)
  async sagaProcessPayment(
    @Payload() command: ProcessPaymentCommand,
    @Ctx() context: any,
  ): Promise<ProcessPaymentResult> {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    const payment = await this.paymentsService.processPayment({
      orderId: command.orderId,
      userId: command.userId,
      amount: command.amount,
      currency: command.currency,
    });

    channel.ack(message);

    if (payment.status === PaymentStatus.FAILED) {
      return { ok: false, reason: 'Payment provider rejected transaction' };
    }

    return { ok: true, paymentId: payment.id };
  }
}
