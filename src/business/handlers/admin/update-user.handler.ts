import { Injectable } from '@nestjs/common';
import { UserNotFoundError } from '../../domain/errors/errors.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

export interface AdminUpdateUserRequest {
  userId: string;
  suspended?: boolean;
  verified?: boolean;
}

@Injectable()
export class AdminUpdateUserHandler extends AbstractRequestHandlerTemplate<AdminUpdateUserRequest, { userId: string }> {
  constructor(private readonly users: UserRepository) {
    super();
  }

  protected async handleRequest(request: AdminUpdateUserRequest): Promise<CommandResponse<{ userId: string }>> {
    const user = await this.users.findById(request.userId);
    if (!user) throw new UserNotFoundError();
    if (request.suspended !== undefined) user.props.suspended = request.suspended;
    if (request.verified !== undefined) user.props.verified = request.verified;
    await this.users.save(user);
    return CommandResponse.of({ userId: user.id });
  }
}
