export interface IdGeneratorPort {
  uuid(): string;
  licenceNumber(): string;
  reference(prefix: string): string;
}
