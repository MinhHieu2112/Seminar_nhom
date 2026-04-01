import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { APP_CONSTANTS } from '../constants/app.constants';

export function sha256Hex(input: string) {
  return createHash(APP_CONSTANTS.CODE_HASH_ALGO).update(input).digest('hex');
}

export function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function randomTokenHex(bytes = 32) {
  return randomBytes(bytes).toString('hex');
}

