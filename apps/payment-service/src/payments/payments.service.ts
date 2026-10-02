import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentStatus } from '../generated/prisma/enums.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async processPayment(data: {
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({
        where: {
          orderId: data.orderId,
        },
      });

      if (existing) {
        return existing;
      }

      /*
       * Simulated payment provider.
       *
       * We'll replace this with a real provider
       * integration later.
       */
      const paymentShouldFail = data.orderId === 'fail-payment';

      if (paymentShouldFail) {
        return tx.payment.create({
          data: {
            orderId: data.orderId,
            userId: data.userId,
            amount: data.amount,
            currency: data.currency,
            status: PaymentStatus.FAILED,
          },
        });
      }

      return tx.payment.create({
        data: {
          orderId: data.orderId,
          userId: data.userId,
          amount: data.amount,
          currency: data.currency,
          status: PaymentStatus.SUCCESS,
        },
      });
    });
  }

  async findByOrderId(orderId: string) {
    return this.prisma.payment.findUnique({
      where: {
        orderId,
      },
    });
  }
}
