import { Injectable, Logger } from '@nestjs/common';
import type { RequestHandler } from './RequestHandler.js';
import type { CommandResponse } from './response/CommandResponse.js';

@Injectable()
export default abstract class AbstractRequestHandlerTemplate<T, U>
  implements RequestHandler<T, U>
{
  protected readonly logger = new Logger(this.constructor.name);

  protected abstract handleRequest(request: T): Promise<CommandResponse<U>>;

  public async handle(request: T): Promise<CommandResponse<U>> {
    this.logger.log('Executing');
    const result = await this.handleRequest(request);
    this.logger.log('Completed');
    return result;
  }
}
