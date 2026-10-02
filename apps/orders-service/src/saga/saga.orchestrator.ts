import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  INVENTORY_SERVICE,
  PAYMENT_SERVICE,
  ClientProxy,
  type CreateOrderDto,
  type ReserveInventoryResult,
  type ReserveInventoryCommand,
  SAGA_PATTERNS,
  type ProcessPaymentResult,
  type ProcessPaymentCommand,
  type ReleaseInventoryResult,
  type ReleaseInventoryCommand,
} from '@repo/common';
import { SagaService } from './saga.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { SagaStep } from '../generated/prisma/enums.js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderSagaOrchestrator {
  private readonly logger = new Logger(OrderSagaOrchestrator.name);

  constructor(
    @Inject(INVENTORY_SERVICE)
    private readonly inventoryClient: ClientProxy,

    @Inject(PAYMENT_SERVICE)
    private readonly paymentClient: ClientProxy,

    private readonly sagaService: SagaService,
    private readonly ordersService: OrdersService,
  ) {}

  async execute(orderId: string, userId: string, dto: CreateOrderDto) {
    await this.sagaService.start(orderId);
    this.logger.log(`[Saga] Started for order ${orderId}`);

    // Reserve order
    await this.sagaService.advance(orderId, SagaStep.RESERVING_INVENTORY);

    const reserveResult = await firstValueFrom(
      this.inventoryClient.send<
        ReserveInventoryResult,
        ReserveInventoryCommand
      >(SAGA_PATTERNS.RESERVE_INVENTORY, {
        orderId,
        userId,
        items: dto.items,
        totalAmount: dto.totalAmount,
        currency: dto.currency,
      }),
    );

    if (!reserveResult.ok) {
      this.logger.warn(
        `[Saga] Inventory reservation failed: ${reserveResult.reason}`,
      );
      await this.ordersService.cancelOrder(orderId);
      await this.sagaService.fail(orderId, reserveResult?.reason);
      return;
    }

    this.logger.log(`[Saga] Inventory reserved for order ${orderId}`);

    // Process payment
    await this.sagaService.advance(orderId, SagaStep.PROCESSING_PAYMENT);

    const paymentResult = await firstValueFrom(
      this.paymentClient.send<ProcessPaymentResult, ProcessPaymentCommand>(
        SAGA_PATTERNS.PROCESS_PAYMENT,
        {
          orderId,
          userId,
          amount: dto.totalAmount,
          currency: dto.currency,
        },
      ),
    );

    if (!paymentResult.ok) {
      this.logger.warn(`[Saga] Payment failed: ${paymentResult.reason}`);

      // Compensate: release the inventory that was just reserved
      await this.sagaService.advance(orderId, SagaStep.RELEASING_INVENTORY);
      await firstValueFrom(
        this.inventoryClient.send<
          ReleaseInventoryResult,
          ReleaseInventoryCommand
        >(SAGA_PATTERNS.RELEASE_INVENTORY, { orderId }),
      );

      await this.ordersService.cancelOrder(orderId);
      await this.sagaService.fail(orderId, paymentResult?.reason);
      return;
    }

    this.logger.log(`[Saga] Payment processed for order ${orderId}`);

    // Confirm payment
    await this.ordersService.confirmOrder(orderId);
    await this.sagaService.complete(orderId);
    this.logger.log(`[Saga] Completed for order ${orderId}`);
  }
}
