import { Injectable } from '@nestjs/common';
import type { CreateOrderDto } from '@repo/common';
import { AppError, ErrorCode } from '@repo/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        userId,
        totalAmount: dto.totalAmount,
        currency: dto.currency,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new AppError({ code: ErrorCode.ORDER_NOT_FOUND, message: `Order ${orderId} not found` });
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });
  }

  async confirmOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new AppError({ code: ErrorCode.ORDER_NOT_FOUND, message: `Order ${orderId} not found` });
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });
  }
}
