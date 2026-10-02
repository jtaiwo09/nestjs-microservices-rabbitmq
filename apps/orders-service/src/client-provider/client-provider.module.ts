import { Global, Module } from '@nestjs/common';
import {
  ClientsModule,
  INVENTORY_SERVICE_PROVIDER,
  PAYMENT_SERVICE_PROVIDER,
} from '@repo/common';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      INVENTORY_SERVICE_PROVIDER,
      PAYMENT_SERVICE_PROVIDER,
    ]),
  ],
  exports: [ClientsModule],
})
export class ClientsProviderModule {}
