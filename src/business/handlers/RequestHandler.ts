import type { CommandResponse } from './response/CommandResponse.js';

export interface RequestHandler<T, U> {
  handle(request: T): Promise<CommandResponse<U>>;
}
