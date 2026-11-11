import { Injectable } from '@nestjs/common';
import type { TokenService } from '../../../auth/token.service.js';
import { EmailTakenError } from '../../domain/errors/errors.js';
import type { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SessionResult {
  userId: string;
  token: string;
  expiresIn: number;
}

@Injectable()
export class SignupHandler extends AbstractRequestHandlerTemplate<SignupRequest, SessionResult> {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasherPort,
    private readonly tokens: TokenService,
  ) {
    super();
  }

  protected async handleRequest(request: SignupRequest): Promise<CommandResponse<SessionResult>> {
    const email = request.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) throw new EmailTakenError();

    const user = await this.users.create({
      name: request.name.trim(),
      email,
      passwordHash: await this.hasher.hash(request.password),
      businessName: null,
      avatarUrl: null,
      isAdmin: false,
      verified: false,
      suspended: false,
    });

    const { token, expiresIn } = this.tokens.issue(user.id);
    return CommandResponse.of({ userId: user.id, token, expiresIn });
  }
}
