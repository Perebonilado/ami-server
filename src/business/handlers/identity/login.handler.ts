import { Injectable } from '@nestjs/common';
import type { TokenService } from '../../../auth/token.service.js';
import { AccountSuspendedError, InvalidCredentialsError } from '../../domain/errors/errors.js';
import type { PasswordHasherPort } from '../../ports/password-hasher.port.js';
import type { UserRepository } from '../../repositories/user.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';
import type { SessionResult } from './signup.handler.js';

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable()
export class LoginHandler extends AbstractRequestHandlerTemplate<LoginRequest, SessionResult> {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasherPort,
    private readonly tokens: TokenService,
  ) {
    super();
  }

  protected async handleRequest(request: LoginRequest): Promise<CommandResponse<SessionResult>> {
    const user = await this.users.findByEmail(request.email.trim().toLowerCase());
    if (!user || !(await this.hasher.verify(request.password, user.props.passwordHash))) {
      throw new InvalidCredentialsError();
    }
    if (user.suspended) throw new AccountSuspendedError();

    const { token, expiresIn } = this.tokens.issue(user.id);
    return CommandResponse.of({ userId: user.id, token, expiresIn });
  }
}
