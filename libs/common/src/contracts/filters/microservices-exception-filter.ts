import { ArgumentsHost, Catch } from "@nestjs/common";
import { BaseRpcExceptionFilter, RpcException } from "@nestjs/microservices";
import { Observable } from "rxjs";
import { normalizeError } from "../errors/service-error.js";

@Catch()
export class RabbitMqExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): Observable<any> {
    const error = normalizeError(exception);

    return super.catch(new RpcException(error), host);
  }
}
