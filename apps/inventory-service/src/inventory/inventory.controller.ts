import { Controller, Inject } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  INVENTORY_EVENTS,
  INVENTORY_SERVICE,
  ORDER_EVENTS,
  Payload,
  PAYMENT_EVENTS,
  ClientProxy,
  type InventoryFailedEvent,
  type OrderCreatedEvent,
  type PaymentFailedEvent,
  MessagePattern,
  SAGA_PATTERNS,
  type ReserveInventoryCommand,
  type RmqContext,
  type ReserveInventoryResult,
  type ReleaseInventoryCommand,
  type ReleaseInventoryResult,
} from '@repo/common';
import { InventoryService } from './inventory.service.js';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    @Inject(INVENTORY_SERVICE)
    private readonly eventsClient: ClientProxy,
  ) {}

  @EventPattern(ORDER_EVENTS.CREATED)
  async handleOrderCreated(
    @Payload() event: OrderCreatedEvent,
    @Ctx() context: any,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      console.log(`[Inventory] order.created: ${event.orderId}`);

      await this.inventoryService.reserve(
        event.orderId,
        event.userId,
        event.items,
        event.totalAmount,
        event.currency,
      );

      // The outbox processor publishes inventory.reserved and marks the record.
      // Publishing here would race with the processor and create a false mark.
      channel.ack(message);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Inventory reservation failed';

      console.error(
        `[Inventory] Reservation failed for ${event.orderId}`,
        error,
      );

      this.eventsClient.emit(INVENTORY_EVENTS.FAILED, {
        orderId: event.orderId,
        reason,
      } satisfies InventoryFailedEvent);

      channel.ack(message);
    }
  }

  @EventPattern(PAYMENT_EVENTS.FAILED)
  async handleFailedPayment(
    @Payload() event: PaymentFailedEvent,
    @Ctx() context: any,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      console.log(`[Inventory] ${PAYMENT_EVENTS.FAILED}: ${event.orderId}`);

      const released = await this.inventoryService.releaseOrderReservations(
        event.orderId,
      );

      this.eventsClient.emit(INVENTORY_EVENTS.RELEASED, {
        orderId: event.orderId,
        releasedItems: released.map((reservation) => ({
          productId: reservation.productId,
          quantity: reservation.quantity,
        })),
        releasedAt: new Date().toISOString(),
      });

      channel.ack(message);
    } catch (error) {
      /*
       * This is different from insufficient stock.
       *
       * The compensation itself failed.
       *
       * We DO NOT ACK because we want RabbitMQ
       * to redeliver the message.
       */
      console.error(
        `[Inventory] Failed to release reservations for ${event.orderId}`,
        error,
      );

      throw error;
    }
  }

  @MessagePattern(SAGA_PATTERNS.RESERVE_INVENTORY)
  async sagaReserveInventory(
    @Payload() command: ReserveInventoryCommand,
    @Ctx() context: RmqContext,
  ): Promise<ReserveInventoryResult> {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      await this.inventoryService.reserve(
        command.orderId,
        command.userId,
        command.items,
        command.totalAmount,
        command.currency,
      );
      channel.ack(message);
      return { ok: true };
    } catch (error) {
      channel.ack(message); // ack — the failure result is the response
      return {
        ok: false,
        reason: error instanceof Error ? error.message : 'Reservation failed',
      };
    }
  }

  @MessagePattern(SAGA_PATTERNS.RELEASE_INVENTORY)
  async sagaReleaseInventory(
    @Payload() command: ReleaseInventoryCommand,
    @Ctx() context: RmqContext,
  ): Promise<ReleaseInventoryResult> {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      await this.inventoryService.releaseOrderReservations(command.orderId);
      channel.ack(message);
      return { ok: true };
    } catch {
      channel.ack(message);
      return { ok: false };
    }
  }
}
