import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../auth/token.service.js';
import {
  AI_PORT,
  BANK_PORT,
  CLOCK_PORT,
  ID_GENERATOR_PORT,
  PASSWORD_HASHER_PORT,
  UNIT_OF_WORK_PORT,
} from '../../business/ports/tokens.js';
import {
  LEDGER_REPOSITORY,
  LICENCE_REPOSITORY,
  PAYMENT_REPOSITORY,
  PAYOUT_ACCOUNT_REPOSITORY,
  PAYOUT_REPOSITORY,
  REVOKED_TOKEN_REPOSITORY,
  USER_REPOSITORY,
  VIDEO_REPOSITORY,
  WEBHOOK_REPOSITORY,
} from '../../business/repositories/tokens.js';
import { MaasAiAdapter } from '../adapters/maas-ai.adapter.js';
import { MockAiAdapter } from '../adapters/mock-ai.adapter.js';
import { MockBankAdapter } from '../adapters/mock-bank.adapter.js';
import { RandomIdGenerator } from '../adapters/random-id-generator.js';
import { ScryptPasswordHasher } from '../adapters/scrypt-password-hasher.js';
import { SystemClock } from '../adapters/system-clock.js';
import { XtradotBankAdapter } from '../adapters/xtradot-bank.adapter.js';
import { BankRequestModel } from '../database/models/index.js';
import { SequelizeLedgerRepository } from '../repositories/sequelize-ledger.repository.js';
import { SequelizeLicenceRepository } from '../repositories/sequelize-licence.repository.js';
import { SequelizePaymentRepository } from '../repositories/sequelize-payment.repository.js';
import { SequelizePayoutAccountRepository } from '../repositories/sequelize-payout-account.repository.js';
import { SequelizePayoutRepository } from '../repositories/sequelize-payout.repository.js';
import { SequelizeRevokedTokenRepository } from '../repositories/sequelize-revoked-token.repository.js';
import { SequelizeUnitOfWork } from '../repositories/sequelize-unit-of-work.js';
import { SequelizeUserRepository } from '../repositories/sequelize-user.repository.js';
import { SequelizeVideoRepository } from '../repositories/sequelize-video.repository.js';
import { SequelizeWebhookRepository } from '../repositories/sequelize-webhook.repository.js';
import { AdminGuard, OptionalSessionGuard, SessionGuard } from '../security/session.guard.js';
import { SessionService } from '../security/session.service.js';

export const repositoryProviders: Provider[] = [
  { provide: UNIT_OF_WORK_PORT, useClass: SequelizeUnitOfWork },
  { provide: USER_REPOSITORY, useClass: SequelizeUserRepository },
  { provide: REVOKED_TOKEN_REPOSITORY, useClass: SequelizeRevokedTokenRepository },
  { provide: VIDEO_REPOSITORY, useClass: SequelizeVideoRepository },
  { provide: LICENCE_REPOSITORY, useClass: SequelizeLicenceRepository },
  { provide: PAYMENT_REPOSITORY, useClass: SequelizePaymentRepository },
  { provide: LEDGER_REPOSITORY, useClass: SequelizeLedgerRepository },
  { provide: PAYOUT_ACCOUNT_REPOSITORY, useClass: SequelizePayoutAccountRepository },
  { provide: PAYOUT_REPOSITORY, useClass: SequelizePayoutRepository },
  { provide: WEBHOOK_REPOSITORY, useClass: SequelizeWebhookRepository },
];

export const adapterProviders: Provider[] = [
  { provide: CLOCK_PORT, useValue: new SystemClock() },
  { provide: ID_GENERATOR_PORT, useValue: new RandomIdGenerator() },
  { provide: PASSWORD_HASHER_PORT, useValue: new ScryptPasswordHasher() },
  {
    provide: BANK_PORT,
    useFactory: (config: ConfigService) => {
      const adapter = config.getOrThrow<string>('BANK_ADAPTER');
      const intraBankCode = config.getOrThrow<string>('XTRADOT_NIP_CODE');
      if (adapter === 'mock') return new MockBankAdapter(config.getOrThrow<string>('FRONTEND_URL'), intraBankCode);
      if (adapter === 'xtradot') {
        return new XtradotBankAdapter(
          config.getOrThrow<string>('BANK_BASE_URL'),
          config.getOrThrow<string>('GATEWAY_KEY'),
          intraBankCode,
          Number(config.getOrThrow<string>('BANK_CALLS_PER_MINUTE')),
          BankRequestModel,
        );
      }
      throw new Error(`Unsupported BANK_ADAPTER: ${adapter}`);
    },
    inject: [ConfigService],
  },
  {
    provide: AI_PORT,
    useFactory: (config: ConfigService) => {
      const adapter = config.getOrThrow<string>('AI_ADAPTER');
      if (adapter === 'mock') return new MockAiAdapter();
      if (adapter === 'maas') {
        return new MaasAiAdapter(
          config.getOrThrow<string>('MAAS_BASE_URL'),
          config.getOrThrow<string>('GATEWAY_KEY'),
          config
            .getOrThrow<string>('MAAS_MODELS')
            .split(',')
            .map((model) => model.trim())
            .filter(Boolean),
          Number(config.getOrThrow<string>('AI_CALLS_PER_MINUTE')),
        );
      }
      throw new Error(`Unsupported AI_ADAPTER: ${adapter}`);
    },
    inject: [ConfigService],
  },
];

export const authProviders: Provider[] = [
  {
    provide: TokenService,
    useFactory: (config: ConfigService) =>
      new TokenService(config.getOrThrow<string>('JWT_SECRET'), config.getOrThrow<string>('JWT_TTL')),
    inject: [ConfigService],
  },
  SessionService,
  SessionGuard,
  OptionalSessionGuard,
  AdminGuard,
];
