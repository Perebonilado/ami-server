import type { User, UserProps } from '../domain/entities/user.js';

export type NewUser = Omit<UserProps, 'id'>;

export interface UserRepository {
  findById(id: string, tx?: unknown): Promise<User | null>;
  findByIdForUpdate(id: string, tx: unknown): Promise<User | null>;
  findByEmail(email: string, tx?: unknown): Promise<User | null>;
  create(user: NewUser, tx?: unknown): Promise<User>;
  save(user: User, tx?: unknown): Promise<void>;
}
