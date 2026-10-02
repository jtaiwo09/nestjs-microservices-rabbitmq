import { Controller, Inject } from '@nestjs/common';
import type { AuthenticatedMessage } from '@repo/auth';
import type {
  ClientProxy,
  CreateOrderDto,
  InventoryFailedEvent,
  OrderCreatedEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  RmqContext,
} from '@repo/common';
import {
  Ctx,
  EventPattern,
  INVENTORY_EVENTS,
  INVENTORY_SERVICE,
  MESSAGE_PATTERNS,
  MessagePattern,
  ORDER_EVENTS,
  Payload,
  PAYMENT_EVENTS,
} from '@repo/common';
import { OrdersService } from './orders.service.js';
import { OrderSagaOrchestrator } from '../saga/saga.orchestrator.js';

@Controller()
export class OrdersController {
  constructor(
    @Inject(INVENTORY_SERVICE)
    private readonly inventoryClient: ClientProxy,
    private readonly orderService: OrdersService,
    private readonly sagaOrchestrator: OrderSagaOrchestrator,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.ORDERS.CREATE)
  async handleCreateOrder(
    @Payload() data: AuthenticatedMessage<CreateOrderDto>,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    const order = await this.orderService.createOrder(
      data.auth.sub!,
      data.data,
    );

    const event = {
      orderId: order.id,
      userId: data.auth.sub!,
      items: data.data.items,
      totalAmount: data.data.totalAmount,
      currency: data.data.currency,
      createdAt: new Date().toISOString(),
    } satisfies OrderCreatedEvent;

    // this.inventoryClient.emit(ORDER_EVENTS.CREATED, event);
    this.sagaOrchestrator.execute(order.id, data.auth.sub!, data.data);

    // channel.ack(message);

    return { orderId: order.id, status: order.status };
  }

  @EventPattern(INVENTORY_EVENTS.FAILED)
  async handleInventoryFailed(
    @Payload() event: InventoryFailedEvent,
    @Ctx() context: any,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await this.orderService.cancelOrder(event.orderId);
      channel.ack(message);
    } catch (error) {
      console.error(`[Orders] Failed to cancel order ${event.orderId}`, error);
      channel.nack(message, false, false);
    }
  }

  @EventPattern(PAYMENT_EVENTS.FAILED)
  async handlePaymentFailed(
    @Payload() event: PaymentFailedEvent,
    @Ctx() context: any,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await this.orderService.cancelOrder(event.orderId);
      channel.ack(message);
    } catch (error) {
      console.error(
        `[Orders] Failed to cancel order on payment failure ${event.orderId}`,
        error,
      );
      channel.nack(message, false, false);
    }
  }

  @EventPattern(PAYMENT_EVENTS.COMPLETED)
  async handlePaymentCompleted(
    @Payload() event: PaymentCompletedEvent,
    @Ctx() context: any,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      console.log(`[Orders] ${PAYMENT_EVENTS.COMPLETED}: ${event.orderId}`);
      const order = await this.orderService.confirmOrder(event.orderId);
      console.log(`[Orders] ${ORDER_EVENTS.CONFIRMED}: ${order.status}`);
      channel.ack(message);
    } catch (error) {
      console.error(`[Orders] Failed to confirm order ${event.orderId}`, error);
      channel.nack(message, false, false);
    }
  }
}
