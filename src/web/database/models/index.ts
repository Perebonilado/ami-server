import type { ModelCtor } from 'sequelize-typescript';
import {
  BankRequestModel,
  SearchIntentModel,
  WebhookEventModel,
  WebhookSubscriptionModel,
} from './integration.models.js';
import { LedgerEntryModel } from './ledger-entry.model.js';
import { LicenceModel } from './licence.model.js';
import { PaymentModel } from './payment.model.js';
import { PayoutAccountModel } from './payout-account.model.js';
import { PayoutModel } from './payout.model.js';
import { RevokedTokenModel } from './revoked-token.model.js';
import { UserModel } from './user.model.js';
import { VideoModel } from './video.model.js';

export {
  BankRequestModel,
  LedgerEntryModel,
  LicenceModel,
  PaymentModel,
  PayoutAccountModel,
  PayoutModel,
  RevokedTokenModel,
  SearchIntentModel,
  UserModel,
  VideoModel,
  WebhookEventModel,
  WebhookSubscriptionModel,
};

export const ALL_MODELS: ModelCtor[] = [
  UserModel,
  RevokedTokenModel,
  VideoModel,
  LicenceModel,
  PaymentModel,
  LedgerEntryModel,
  PayoutAccountModel,
  PayoutModel,
  WebhookEventModel,
  WebhookSubscriptionModel,
  SearchIntentModel,
  BankRequestModel,
];
