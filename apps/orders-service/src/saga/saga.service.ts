import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SagaStatus, SagaStep } from '../generated/prisma/enums.js';

@Injectable()
export class SagaService {
  constructor(private readonly prisma: PrismaService) {}

  async start(orderId: string) {
    return this.prisma.sagaState.create({
      data: { orderId },
    });
  }

  async advance(orderId: string, step: SagaStep) {
    return this.prisma.sagaState.update({
      where: { orderId },
      data: { step },
    });
  }

  async complete(orderId: string) {
    return this.prisma.sagaState.update({
      where: { orderId },
      data: {
        step: SagaStep.COMPLETED,
        status: SagaStatus.COMPLETED,
        failureReason: null,
      },
    });
  }

  async fail(orderId: string, reason: string | undefined) {
    return this.prisma.sagaState.update({
      where: { orderId },
      data: {
        step: SagaStep.FAILED,
        status: SagaStatus.FAILED,
        failureReason: reason ?? null,
      },
    });
  }

  async timeout(orderId: string): Promise<void> {
    await this.prisma.sagaState.update({
      where: { orderId },
      data: {
        status: SagaStatus.TIMED_OUT,
        failureReason: 'Saga exceeded the maximum execution time',
      },
    });
  }

  async findByOrderId(orderId: string) {
    return this.prisma.sagaState.findUnique({
      where: { orderId },
    });
  }
}
