import crypto from 'crypto';
import { config } from '../config/env';

export interface MediaSignPayload {
  userId: string;
  videoId: string;
  sessionId: string;
  expiresAt: number; // Unix timestamp in seconds
}

/**
 * Generate a short-lived HMAC-SHA256 signature for video streaming access.
 * Prevents hotlinking, scraping, and unauthorized viewing.
 */
export function generateSignedMediaToken(payload: Omit<MediaSignPayload, 'expiresAt'>, ttlSeconds: number = 7200): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const data = `${payload.userId}:${payload.videoId}:${payload.sessionId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', config.mediaSigningSecret);
  hmac.update(data);
  const signature = hmac.digest('hex');

  // Pack as base64url string
  const tokenObject: MediaSignPayload & { sig: string } = {
    ...payload,
    expiresAt,
    sig: signature,
  };

  return Buffer.from(JSON.stringify(tokenObject)).toString('base64url');
}

/**
 * Verify a signed media token.
 */
export function verifySignedMediaToken(token: string): { valid: boolean; payload?: MediaSignPayload; error?: string } {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    const parsed = JSON.parse(raw);
    const { userId, videoId, sessionId, expiresAt, sig } = parsed;

    if (!userId || !videoId || !sessionId || !expiresAt || !sig) {
      return { valid: false, error: 'Malformed media token structure' };
    }

    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return { valid: false, error: 'Media playback token expired' };
    }

    const data = `${userId}:${videoId}:${sessionId}:${expiresAt}`;
    const hmac = crypto.createHmac('sha256', config.mediaSigningSecret);
    hmac.update(data);
    const expectedSig = hmac.digest('hex');

    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, error: 'Invalid media token signature' };
    }

    return { valid: true, payload: { userId, videoId, sessionId, expiresAt } };
  } catch {
    return { valid: false, error: 'Unable to parse media token' };
  }
}
