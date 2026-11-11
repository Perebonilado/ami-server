import type { LedgerAccount, LedgerKind } from '../domain/values/enums.js';

export interface LedgerEntry {
  account: LedgerAccount;
  userId: string | null;
  amountKobo: number;
  kind: LedgerKind;
  licenceId: string | null;
  payoutId: string | null;
}

export interface LedgerRepository {
  add(entries: LedgerEntry[], tx?: unknown): Promise<void>;
  creatorBalance(userId: string, tx?: unknown): Promise<number>;
  hasEntry(kind: LedgerKind, ref: { licenceId?: string; payoutId?: string }, tx?: unknown): Promise<boolean>;
}
