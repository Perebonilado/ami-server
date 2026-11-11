export const MAX_CHECKS = 10;
const MAX_WAIT_MINUTES = 60;

export function nextCheckAt(attempts: number, now: Date): Date | null {
  if (attempts >= MAX_CHECKS) return null;
  const minutes = Math.min(MAX_WAIT_MINUTES, 2 ** attempts);
  return new Date(now.getTime() + minutes * 60 * 1000);
}
