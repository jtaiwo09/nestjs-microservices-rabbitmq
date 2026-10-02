import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  ClientProxy,
  CreateOrderDto,
  MESSAGE_PATTERNS,
  ORDER_SERVICE,
  RmqRecordBuilder,
} from '@repo/common';
import { firstValueFrom } from 'rxjs';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/auth/types/authenticated-user.js';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(ORDER_SERVICE)
    private readonly orderCient: ClientProxy,
  ) {}

  @Post()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = {
      data: dto,
      auth: {
        sub: user.sub,
        role: user.role,
        authenticate: true,
      },
    };

    const record = new RmqRecordBuilder(data)
      .setOptions({
        headers: {
          'x-version': '1.0.0',
        },
      })
      .build();

    return firstValueFrom(
      this.orderCient.send(MESSAGE_PATTERNS.ORDERS.CREATE, record),
    );
  }

  @Get(':id/saga')
  async getSaga(@Param('id') orderId: string, @CurrentUser() user: AuthUser) {
    const saga = await firstValueFrom(
      this.orderCient.send(MESSAGE_PATTERNS.SAGA.GET, {
        data: { orderId },
        auth: { sub: user.sub },
      }),
    );

    if (!saga) {
      throw new NotFoundException(`Saga for order ${orderId} was not found`);
    }

    return saga;
  }
}
