import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { OutboxProcessorService } from './outbox-processor.service.js';
import { ClientsModule, INVENTORY_SERVICE_PROVIDER } from '@repo/common';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, OutboxProcessorService],
  imports: [ClientsModule.registerAsync([INVENTORY_SERVICE_PROVIDER])],
})
export class InventoryModule {}
