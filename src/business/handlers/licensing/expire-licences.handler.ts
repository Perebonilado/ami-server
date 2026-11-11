import { Injectable } from '@nestjs/common';
import type { ClockPort } from '../../ports/clock.port.js';
import type { LicenceRepository } from '../../repositories/licence.repository.js';
import AbstractRequestHandlerTemplate from '../AbstractRequestHandlerTemplate.js';
import { CommandResponse } from '../response/CommandResponse.js';

@Injectable()
export class ExpireLicencesHandler extends AbstractRequestHandlerTemplate<void, { expired: number }> {
  constructor(
    private readonly licences: LicenceRepository,
    private readonly clock: ClockPort,
  ) {
    super();
  }

  protected async handleRequest(): Promise<CommandResponse<{ expired: number }>> {
    const expired = await this.licences.expireEnded(this.clock.now());
    return CommandResponse.of({ expired });
  }
}
