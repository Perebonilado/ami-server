export const LICENCE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function formatLicenceNumber(body: string): string {
  return `AMI-${body.slice(0, 4)}-${body.slice(4, 8)}`;
}

export function normaliseLicenceNumber(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = raw.startsWith('AMI') ? raw.slice(3) : raw;
  if (body.length !== 8) return input.trim().toUpperCase();
  return formatLicenceNumber(body);
}
