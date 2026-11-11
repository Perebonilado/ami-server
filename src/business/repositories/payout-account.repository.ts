export interface PayoutAccount {
  id: string;
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verifiedAt: Date;
}

export interface PayoutAccountRepository {
  findByUserId(userId: string, tx?: unknown): Promise<PayoutAccount | null>;
  upsert(account: Omit<PayoutAccount, 'id'>, tx?: unknown): Promise<PayoutAccount>;
}
