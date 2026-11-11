import { Injectable } from '@nestjs/common';
import { EmailTakenError, InvalidInputError, UserNotFoundError } from '../../domain/errors/errors.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

export interface UpdateProfileRequest {
  userId: string;
  name?: string;
  email?: string;
  businessName?: string | null;
}

@Injectable()
export class UpdateProfileHandler extends AbstractRequestHandlerTemplate<UpdateProfileRequest, { userId: string }> {
  constructor(private readonly users: UserRepository) {
    super();
  }

  protected async handleRequest(request: UpdateProfileRequest): Promise<CommandResponse<{ userId: string }>> {
    const user = await this.users.findById(request.userId);
    if (!user) throw new UserNotFoundError();

    if (request.name !== undefined) {
      const name = request.name.trim();
      if (!name) throw new InvalidInputError('Your name can’t be empty.');
      user.props.name = name;
    }
    if (request.email !== undefined) {
      const email = request.email.trim().toLowerCase();
      const owner = await this.users.findByEmail(email);
      if (owner && owner.id !== user.id) throw new EmailTakenError('Another account already uses this email.');
      user.props.email = email;
    }
    if (request.businessName !== undefined) {
      user.props.businessName = request.businessName?.trim() || null;
    }

    await this.users.save(user);
    return CommandResponse.of({ userId: user.id });
  }
}
