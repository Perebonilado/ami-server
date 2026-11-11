import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../../auth/token.service.js';
import { ModerateVideoHandler } from '../../business/handlers/admin/moderate-video.handler.js';
import { AdminUpdateUserHandler } from '../../business/handlers/admin/update-user.handler.js';
import { LoginHandler } from '../../business/handlers/identity/login.handler.js';
import { LogoutHandler } from '../../business/handlers/identity/logout.handler.js';
import { SignupHandler } from '../../business/handlers/identity/signup.handler.js';
import { UpdateProfileHandler } from '../../business/handlers/identity/update-profile.handler.js';
import { CreateCheckoutHandler } from '../../business/handlers/licensing/create-checkout.handler.js';
import { ExpireLicencesHandler } from '../../business/handlers/licensing/expire-licences.handler.js';
import { ConfirmPaymentHandler } from '../../business/handlers/payments/confirm-payment.handler.js';
import { SimulatePaymentHandler } from '../../business/handlers/payments/simulate-payment.handler.js';
import { RequestPayoutHandler } from '../../business/handlers/payouts/request-payout.handler.js';
import { SavePayoutAccountHandler } from '../../business/handlers/payouts/save-payout-account.handler.js';
import { SettlePayoutHandler } from '../../business/handlers/payouts/settle-payout.handler.js';
import { CreateVideoHandler } from '../../business/handlers/videos/create-video.handler.js';
import { UpdateVideoHandler } from '../../business/handlers/videos/update-video.handler.js';
import { ReceiveWebhookHandler } from '../../business/handlers/webhooks/receive-webhook.handler.js';
import { RegisterWebhookHandler } from '../../business/handlers/webhooks/register-webhook.handler.js';
import type { AiPort } from '../../business/ports/ai.port.js';
import type { BankPort } from '../../business/ports/bank.port.js';
import type { ClockPort } from '../../business/ports/clock.port.js';
import type { IdGeneratorPort } from '../../business/ports/id-generator.port.js';
import type { PasswordHasherPort } from '../../business/ports/password-hasher.port.js';
import {
  AI_PORT,
  BANK_PORT,
  CLOCK_PORT,
  ID_GENERATOR_PORT,
  PASSWORD_HASHER_PORT,
  UNIT_OF_WORK_PORT,
} from '../../business/ports/tokens.js';
import type { UnitOfWorkPort } from '../../business/ports/unit-of-work.port.js';
import type { LedgerRepository } from '../../business/repositories/ledger.repository.js';
import type { LicenceRepository } from '../../business/repositories/licence.repository.js';
import type { PaymentRepository } from '../../business/repositories/payment.repository.js';
import type { PayoutAccountRepository } from '../../business/repositories/payout-account.repository.js';
import type { PayoutRepository } from '../../business/repositories/payout.repository.js';
import type { RevokedTokenRepository } from '../../business/repositories/revoked-token.repository.js';
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
import type { UserRepository } from '../../business/repositories/user.repository.js';
import type { VideoRepository } from '../../business/repositories/video.repository.js';
import type { WebhookRepository } from '../../business/repositories/webhook.repository.js';

const DEFAULT_PREVIEWS = [
  'https://videos.pexels.com/video-files/4994037/4994037-sd_960_540_25fps.mp4',
  'https://videos.pexels.com/video-files/8496469/8496469-sd_960_540_25fps.mp4',
  'https://videos.pexels.com/video-files/10200319/10200319-sd_540_960_25fps.mp4',
];

export const handlerProviders: Provider[] = [
  {
    provide: SignupHandler,
    useFactory: (users: UserRepository, hasher: PasswordHasherPort, tokens: TokenService) =>
      new SignupHandler(users, hasher, tokens),
    inject: [USER_REPOSITORY, PASSWORD_HASHER_PORT, TokenService],
  },
  {
    provide: LoginHandler,
    useFactory: (users: UserRepository, hasher: PasswordHasherPort, tokens: TokenService) =>
      new LoginHandler(users, hasher, tokens),
    inject: [USER_REPOSITORY, PASSWORD_HASHER_PORT, TokenService],
  },
  {
    provide: LogoutHandler,
    useFactory: (revokedTokens: RevokedTokenRepository, clock: ClockPort) => new LogoutHandler(revokedTokens, clock),
    inject: [REVOKED_TOKEN_REPOSITORY, CLOCK_PORT],
  },
  {
    provide: UpdateProfileHandler,
    useFactory: (users: UserRepository) => new UpdateProfileHandler(users),
    inject: [USER_REPOSITORY],
  },
  {
    provide: CreateVideoHandler,
    useFactory: (videos: VideoRepository, users: UserRepository, ai: AiPort, config: ConfigService) => {
      const pool = (config.get<string>('SAMPLE_PREVIEW_URLS') ?? '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
      return new CreateVideoHandler(videos, users, ai, pool.length ? pool : DEFAULT_PREVIEWS);
    },
    inject: [VIDEO_REPOSITORY, USER_REPOSITORY, AI_PORT, ConfigService],
  },
  {
    provide: UpdateVideoHandler,
    useFactory: (videos: VideoRepository, users: UserRepository) => new UpdateVideoHandler(videos, users),
    inject: [VIDEO_REPOSITORY, USER_REPOSITORY],
  },
  {
    provide: CreateCheckoutHandler,
    useFactory: (
      unitOfWork: UnitOfWorkPort,
      videos: VideoRepository,
      users: UserRepository,
      licences: LicenceRepository,
      payments: PaymentRepository,
      bank: BankPort,
      ids: IdGeneratorPort,
      clock: ClockPort,
      config: ConfigService,
    ) =>
      new CreateCheckoutHandler(
        unitOfWork,
        videos,
        users,
        licences,
        payments,
        bank,
        ids,
        clock,
        `${config.getOrThrow<string>('APP_URL')}/api/payments/callback`,
      ),
    inject: [
      UNIT_OF_WORK_PORT,
      VIDEO_REPOSITORY,
      USER_REPOSITORY,
      LICENCE_REPOSITORY,
      PAYMENT_REPOSITORY,
      BANK_PORT,
      ID_GENERATOR_PORT,
      CLOCK_PORT,
      ConfigService,
    ],
  },
  {
    provide: ConfirmPaymentHandler,
    useFactory: (
      unitOfWork: UnitOfWorkPort,
      payments: PaymentRepository,
      licences: LicenceRepository,
      videos: VideoRepository,
      ledger: LedgerRepository,
      bank: BankPort,
      clock: ClockPort,
    ) => new ConfirmPaymentHandler(unitOfWork, payments, licences, videos, ledger, bank, clock),
    inject: [
      UNIT_OF_WORK_PORT,
      PAYMENT_REPOSITORY,
      LICENCE_REPOSITORY,
      VIDEO_REPOSITORY,
      LEDGER_REPOSITORY,
      BANK_PORT,
      CLOCK_PORT,
    ],
  },
  {
    provide: SimulatePaymentHandler,
    useFactory: (payments: PaymentRepository, bank: BankPort, confirm: ConfirmPaymentHandler, config: ConfigService) =>
      new SimulatePaymentHandler(payments, bank, confirm, config.get<string>('ALLOW_PAYMENT_SIMULATION') === 'true'),
    inject: [PAYMENT_REPOSITORY, BANK_PORT, ConfirmPaymentHandler, ConfigService],
  },
  {
    provide: ExpireLicencesHandler,
    useFactory: (licences: LicenceRepository, clock: ClockPort) => new ExpireLicencesHandler(licences, clock),
    inject: [LICENCE_REPOSITORY, CLOCK_PORT],
  },
  {
    provide: SavePayoutAccountHandler,
    useFactory: (bank: BankPort, accounts: PayoutAccountRepository, clock: ClockPort) =>
      new SavePayoutAccountHandler(bank, accounts, clock),
    inject: [BANK_PORT, PAYOUT_ACCOUNT_REPOSITORY, CLOCK_PORT],
  },
  {
    provide: SettlePayoutHandler,
    useFactory: (
      unitOfWork: UnitOfWorkPort,
      payouts: PayoutRepository,
      ledger: LedgerRepository,
      bank: BankPort,
      clock: ClockPort,
    ) => new SettlePayoutHandler(unitOfWork, payouts, ledger, bank, clock),
    inject: [UNIT_OF_WORK_PORT, PAYOUT_REPOSITORY, LEDGER_REPOSITORY, BANK_PORT, CLOCK_PORT],
  },
  {
    provide: RequestPayoutHandler,
    useFactory: (
      unitOfWork: UnitOfWorkPort,
      users: UserRepository,
      accounts: PayoutAccountRepository,
      payouts: PayoutRepository,
      ledger: LedgerRepository,
      bank: BankPort,
      ids: IdGeneratorPort,
      clock: ClockPort,
      settle: SettlePayoutHandler,
      config: ConfigService,
    ) =>
      new RequestPayoutHandler(
        unitOfWork,
        users,
        accounts,
        payouts,
        ledger,
        bank,
        ids,
        clock,
        settle,
        config.getOrThrow<string>('AMI_BANK_ACCOUNT'),
      ),
    inject: [
      UNIT_OF_WORK_PORT,
      USER_REPOSITORY,
      PAYOUT_ACCOUNT_REPOSITORY,
      PAYOUT_REPOSITORY,
      LEDGER_REPOSITORY,
      BANK_PORT,
      ID_GENERATOR_PORT,
      CLOCK_PORT,
      SettlePayoutHandler,
      ConfigService,
    ],
  },
  {
    provide: ReceiveWebhookHandler,
    useFactory: (
      webhooks: WebhookRepository,
      confirm: ConfirmPaymentHandler,
      settle: SettlePayoutHandler,
      clock: ClockPort,
    ) => new ReceiveWebhookHandler(webhooks, confirm, settle, clock),
    inject: [WEBHOOK_REPOSITORY, ConfirmPaymentHandler, SettlePayoutHandler, CLOCK_PORT],
  },
  {
    provide: RegisterWebhookHandler,
    useFactory: (bank: BankPort, webhooks: WebhookRepository) => new RegisterWebhookHandler(bank, webhooks),
    inject: [BANK_PORT, WEBHOOK_REPOSITORY],
  },
  {
    provide: AdminUpdateUserHandler,
    useFactory: (users: UserRepository) => new AdminUpdateUserHandler(users),
    inject: [USER_REPOSITORY],
  },
  {
    provide: ModerateVideoHandler,
    useFactory: (videos: VideoRepository) => new ModerateVideoHandler(videos),
    inject: [VIDEO_REPOSITORY],
  },
];
