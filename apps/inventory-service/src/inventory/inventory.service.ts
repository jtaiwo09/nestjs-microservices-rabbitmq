import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReservationStatus } from '../generated/prisma/enums.js';
import { INVENTORY_EVENTS, type InventoryReservedEvent } from '@repo/common';

export interface ReserveItemInput {
  productId: string;
  quantity: number;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async reserve(
    orderId: string,
    userId: string,
    items: ReserveItemInput[],
    totalAmount: number,
    currency: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const reservations = [];

      for (const item of items) {
        const inventory = await tx.inventoryItem.findUnique({
          where: {
            productId: item.productId,
          },
        });

        if (!inventory) {
          throw new Error(`Inventory not found for product ${item.productId}`);
        }

        const available = inventory.quantity - inventory.reserved;

        if (available < item.quantity) {
          throw new Error(
            `Insufficient inventory for product ${item.productId}`,
          );
        }

        await tx.inventoryItem.update({
          where: {
            productId: item.productId,
          },
          data: {
            reserved: {
              increment: item.quantity,
            },
          },
        });

        const reservation = await tx.inventoryReservation.upsert({
          where: {
            orderId_productId: {
              orderId,
              productId: item.productId,
            },
          },

          create: {
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            status: ReservationStatus.RESERVED,
          },

          update: {
            quantity: item.quantity,
            status: ReservationStatus.RESERVED,
          },
        });

        reservations.push(reservation);
      }

      const outboxPayload: InventoryReservedEvent = {
        orderId,
        userId,
        items,
        totalAmount,
        currency,
        reservedAt: new Date().toISOString(),
      };

      await tx.outboxEvent.create({
        data: {
          eventType: INVENTORY_EVENTS.RESERVED,
          payload: outboxPayload as object,
        },
      });

      return reservations;
    });
  }

  async releaseOrderReservations(orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservations = await tx.inventoryReservation.findMany({
        where: {
          orderId,
          status: ReservationStatus.RESERVED,
        },
      });

      if (reservations.length === 0) {
        return [];
      }

      for (const reservation of reservations) {
        await tx.inventoryItem.update({
          where: {
            productId: reservation.productId,
          },
          data: {
            reserved: {
              decrement: reservation.quantity,
            },
          },
        });

        await tx.inventoryReservation.update({
          where: {
            id: reservation.id,
          },
          data: {
            status: ReservationStatus.RELEASED,
          },
        });
      }

      return reservations;
    });
  }

  async getOrderReservations(orderId: string) {
    return this.prisma.inventoryReservation.findMany({
      where: {
        orderId,
      },
    });
  }

  async createInventory(productId: string, quantity: number) {
    return this.prisma.inventoryItem.create({
      data: {
        productId,
        quantity,
      },
    });
  }
}
