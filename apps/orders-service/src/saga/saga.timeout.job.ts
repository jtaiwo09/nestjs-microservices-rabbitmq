import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service.js';
import { SagaStatus } from '../generated/prisma/enums.js';

@Injectable()
export class SagaTimeoutJob {
  private readonly logger = new Logger(SagaTimeoutJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredSagas(): Promise<void> {
    const timeoutThreshold = new Date(Date.now() - 5 * 60 * 1000);

    const result = await this.prisma.sagaState.updateMany({
      where: {
        status: SagaStatus.RUNNING,
        createdAt: {
          lt: timeoutThreshold,
        },
      },
      data: {
        status: SagaStatus.TIMED_OUT,
        failureReason: 'Saga has been running for more than 5 minutes',
      },
    });

    if (result.count > 0) {
      this.logger.warn(`Marked ${result.count} saga(s) as timed out`);
    }
  }
}
