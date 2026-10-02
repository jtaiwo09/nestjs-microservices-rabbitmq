import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy, INVENTORY_SERVICE } from '@repo/common';
import { PrismaService } from '../prisma/prisma.service.js';

const CLEANUP_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(INVENTORY_SERVICE) private readonly eventsClient: ClientProxy,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processUnpublished() {
    const unpublished = await this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      take: BATCH_SIZE,
      orderBy: { createdAt: 'asc' },
    });

    if (unpublished.length === 0) return;

    for (const event of unpublished) {
      try {
        this.eventsClient.emit(event.eventType, event.payload);

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { publishedAt: new Date() },
        });

        this.logger.log(`[Outbox] Published: ${event.eventType} (${event.id})`);
      } catch (error) {
        this.logger.error(
          `[Outbox] Failed to publish event ${event.id}`,
          error,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupPublished() {
    const cutoff = new Date(Date.now() - CLEANUP_RETENTION_MS);

    const { count } = await this.prisma.outboxEvent.deleteMany({
      where: { publishedAt: { not: null, lt: cutoff } },
    });

    if (count > 0) {
      this.logger.log(
        `[Outbox] Cleaned up ${count} published event(s) older than 7 days`,
      );
    }
  }
}
