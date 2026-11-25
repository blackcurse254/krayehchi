import type { DriverProfile, FareMode } from '../types/driver';
import { onlyDigits } from './persianNumbers';

interface CompactDriverPayload {
  v: 1;
  n: string; // name
  c: string; // carModel
  p: [string, string, string, string]; // [left2, letter, right3, iranCode]
  k: string; // 16-digit cardNumber
  m: 'v' | 'f'; // variable or fixed
  a?: number; // fixedAmount
  g?: string; // gatewayUrl
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/') +
    '==='.slice((b64url.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function sanitizeGatewayUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

export function encodeDriverProfile(profile: DriverProfile): string {
  const payload: CompactDriverPayload = {
    v: 1,
    n: profile.name.trim(),
    c: profile.carModel.trim(),
    p: [
      onlyDigits(profile.plate.left2, 2),
      profile.plate.letter.trim() || 'ت',
      onlyDigits(profile.plate.right3, 3),
      onlyDigits(profile.plate.iranCode, 2),
    ],
    k: onlyDigits(profile.cardNumber, 16),
    m: profile.fareMode === 'fixed' ? 'f' : 'v',
  };

  if (profile.fareMode === 'fixed' && profile.fixedAmount > 0) {
    payload.a = Math.floor(profile.fixedAmount);
  }

  const safeGateway = sanitizeGatewayUrl(profile.gatewayUrl);
  if (safeGateway) {
    payload.g = safeGateway;
  }

  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export function decodeDriverProfile(encoded: string): DriverProfile | null {
  if (!encoded || typeof encoded !== 'string') return null;
  try {
    const bytes = base64UrlToBytes(encoded.trim());
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json) as Partial<CompactDriverPayload>;

    if (
      !data ||
      typeof data.n !== 'string' ||
      typeof data.c !== 'string' ||
      !Array.isArray(data.p) ||
      data.p.length !== 4 ||
      typeof data.k !== 'string'
    ) {
      return null;
    }

    const cardNumber = onlyDigits(data.k, 16);
    if (cardNumber.length !== 16) {
      return null;
    }

    const fareMode: FareMode = data.m === 'f' ? 'fixed' : 'variable';
    const fixedAmount =
      typeof data.a === 'number' && Number.isFinite(data.a) && data.a > 0
        ? Math.floor(data.a)
        : 50000;

    return {
      name: data.n.trim(),
      carModel: data.c.trim(),
      plate: {
        left2: onlyDigits(String(data.p[0] ?? ''), 2),
        letter: String(data.p[1] ?? 'ت').trim() || 'ت',
        right3: onlyDigits(String(data.p[2] ?? ''), 3),
        iranCode: onlyDigits(String(data.p[3] ?? ''), 2),
      },
      cardNumber,
      fareMode,
      fixedAmount,
      gatewayUrl: typeof data.g === 'string' ? sanitizeGatewayUrl(data.g) : '',
    };
  } catch {
    return null;
  }
}

export function buildPassengerShareUrl(profile: DriverProfile, origin: string): string {
  const encoded = encodeDriverProfile(profile);
  // origin may include a sub-path (e.g. https://user.github.io/krayechi/)
  const cleanBase = origin.replace(/[?#].*$/, '').replace(/\/+$/, '');
  return `${cleanBase}/?d=${encoded}`;
}
