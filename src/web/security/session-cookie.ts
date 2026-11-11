import type { Response } from 'express';

export const SESSION_COOKIE = 'ami_session';

export function setSessionCookie(response: Response, token: string, expiresInSec: number, secure: boolean): void {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: expiresInSec * 1000,
  });
}

export function clearSessionCookie(response: Response, secure: boolean): void {
  response.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure, path: '/' });
}
