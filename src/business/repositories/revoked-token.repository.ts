export interface RevokedTokenRepository {
  revoke(token: { tokenId: string; userId: string; expiresAt: Date }): Promise<void>;
  isRevoked(tokenId: string): Promise<boolean>;
  deleteExpired(now: Date): Promise<void>;
}
