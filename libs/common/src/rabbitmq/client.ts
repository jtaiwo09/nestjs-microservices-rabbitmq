import {
  Transport,
  type ClientsProviderAsyncOptions,
} from "@nestjs/microservices";
import { ConfigService } from "@repo/config";
import { EXCHANGE } from "./queues.js";

interface CreateRmqClientConfigOptions {
  name: string;
  queue?: string;
  noAck?: boolean;
}

export function createRmqClientConfig({
  name,
  queue,
  noAck = true,
}: CreateRmqClientConfigOptions): ClientsProviderAsyncOptions {
  return {
    name,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      transport: Transport.RMQ,
      options: {
        urls: [config.getOrThrow<string>("rabbitmq.url")],
        ...(queue && { queue, queueOptions: { durable: true } }),
        noAck,
        exchange: EXCHANGE,
        exchangeType: "topic",
        wildcards: true,
      },
    }),
  };
}
