export interface UnitOfWorkPort {
  runInTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}
