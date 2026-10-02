import { Controller } from '@nestjs/common';
import {
  Ctx,
  MESSAGE_PATTERNS,
  MessagePattern,
  Payload,
  type RmqContext,
} from '@repo/common';
import type { AuthenticatedMessage } from '@repo/auth';
import { SagaService } from './saga.service.js';

@Controller()
export class SagaController {
  constructor(private readonly sagaService: SagaService) {}

  @MessagePattern(MESSAGE_PATTERNS.SAGA.GET)
  async handleGetSaga(
    @Payload() data: AuthenticatedMessage<{ orderId: string }>,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    const saga = await this.sagaService.findByOrderId(data.data.orderId);

    channel.ack(message);

    return saga;
  }
}
