import type { DriverProfile, SubscriptionPlan, SubscriptionState } from '../types/driver';
import { toEnglishDigits } from './persianNumbers';
import { decodeDriverProfile, encodeDriverProfile } from './urlCodec';

/**
 * پین پیش‌فرض ورود ادمین — برای تغییر رمز مدیریت در نسخه نهایی، این مقدار را ویرایش کنید.
 * Default Admin PIN — change this constant to customize the admin access PIN.
 */
export const DEFAULT_ADMIN_PIN = '2026';

export const ADMIN_SUPPORT_CONTACT = {
  telegram: '@shayan_yosefi',
};

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const PLAN_PREFIX_MAP: Record<SubscriptionPlan, { prefix: string; label: string }> = {
  '1m': { prefix: '1M', label: 'اشتراک ۱ ماهه' },
  '3m': { prefix: '3M', label: 'اشتراک ۳ ماهه' },
  '1y': { prefix: '1Y', label: 'اشتراک ۱ ساله' },
};

export interface CustomCodeEntry {
  code: string;
  planLabel: string;
}

export interface ActivationValidationResult {
  valid: boolean;
  normalizedCode: string;
  planLabel: string;
  source: 'checksum' | 'custom' | 'invalid';
}

function computeChecksumChar(body7: string): string {
  let sum = 0;
  for (let i = 0; i < body7.length; i++) {
    sum += body7.charCodeAt(i) * (i + 7);
  }
  return CODE_ALPHABET[sum % CODE_ALPHABET.length];
}

export function normalizeActivationCode(raw: string): string {
  const cleaned = toEnglishDigits(raw)
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
    .replace(/[–—−]/g, '-')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  // Support KCXXXXXXXX typed without hyphens as KC-XXXX-XXXX
  const noHyphenMatch = /^KC([A-Z0-9]{4})([A-Z0-9]{4})$/.exec(cleaned);
  if (noHyphenMatch) {
    return `KC-${noHyphenMatch[1]}-${noHyphenMatch[2]}`;
  }

  return cleaned;
}

export function inferPlanLabelFromCode(normalizedCode: string): string {
  const clean = normalizedCode.replace(/^KC-/, '');
  if (clean.startsWith('1M')) return 'اشتراک ۱ ماهه';
  if (clean.startsWith('3M')) return 'اشتراک ۳ ماهه';
  if (clean.startsWith('1Y')) return 'اشتراک ۱ ساله';
  return 'اشتراک ویژه';
}

export function generateActivationCode(plan: SubscriptionPlan = '1m'): string {
  const { prefix } = PLAN_PREFIX_MAP[plan];
  const randomChar = () =>
    CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];

  // 7-char body: 2-char plan prefix + 5 random chars -> plus 1 deterministic checksum char
  const body7 = `${prefix}${randomChar()}${randomChar()}${randomChar()}${randomChar()}${randomChar()}`;
  const checksum = computeChecksumChar(body7);
  const full8 = `${body7}${checksum}`;
  return `KC-${full8.slice(0, 4)}-${full8.slice(4, 8)}`;
}

export function getPlanLabel(plan: SubscriptionPlan): string {
  return PLAN_PREFIX_MAP[plan].label;
}

export function validateActivationCode(
  rawInput: string,
  customCodes: CustomCodeEntry[] = []
): ActivationValidationResult {
  const normalized = normalizeActivationCode(rawInput);
  if (!normalized) {
    return {
      valid: false,
      normalizedCode: '',
      planLabel: '',
      source: 'invalid',
    };
  }

  // 1. Check custom admin-configured codes in localStorage first
  const customMatch = customCodes.find(
    (entry) => normalizeActivationCode(entry.code) === normalized
  );
  if (customMatch) {
    return {
      valid: true,
      normalizedCode: normalized,
      planLabel: customMatch.planLabel || 'اشتراک اختصاصی',
      source: 'custom',
    };
  }

  // 2. Structured deterministic format: KC-XXXX-XXXX
  const match = /^KC-([A-Z0-9]{4})-([A-Z0-9]{4})$/.exec(normalized);
  if (!match) {
    return {
      valid: false,
      normalizedCode: normalized,
      planLabel: '',
      source: 'invalid',
    };
  }

  const full8 = `${match[1]}${match[2]}`;
  const body7 = full8.slice(0, 7);
  const providedChecksum = full8[7];
  const expectedChecksum = computeChecksumChar(body7);

  if (providedChecksum !== expectedChecksum) {
    return {
      valid: false,
      normalizedCode: normalized,
      planLabel: '',
      source: 'invalid',
    };
  }

  return {
    valid: true,
    normalizedCode: normalized,
    planLabel: inferPlanLabelFromCode(normalized),
    source: 'checksum',
  };
}

export const INITIAL_INACTIVE_SUBSCRIPTION: SubscriptionState = {
  isActive: false,
  code: '',
  planLabel: '',
  activatedAt: '',
};

/**
 * Quick Transfer Code (کد انتقال پروفایل)
 * Format: KCT1:<encodedDriverProfile>[.<activationCode>]
 */
export function encodeTransferCode(
  profile: DriverProfile,
  activationCode?: string
): string {
  const encodedProfile = encodeDriverProfile(profile);
  const normCode = activationCode ? normalizeActivationCode(activationCode) : '';
  return normCode ? `KCT1:${encodedProfile}.${normCode}` : `KCT1:${encodedProfile}`;
}

export interface DecodedTransferBundle {
  profile: DriverProfile;
  activationCode: string | null;
}

export function decodeTransferCode(
  rawInput: string,
  customCodes: CustomCodeEntry[] = []
): DecodedTransferBundle | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Support either KCT1:<payload>[.<code>] or full ?d=<payload> URL
  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('?d=')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://x.local/${trimmed}`);
      const d = url.searchParams.get('d');
      if (d) {
        const profile = decodeDriverProfile(d);
        return profile ? { profile, activationCode: null } : null;
      }
    } catch {
      return null;
    }
  }

  const body = trimmed.startsWith('KCT1:') ? trimmed.slice(5).trim() : trimmed;
  const dotIdx = body.indexOf('.');
  const profileToken = dotIdx === -1 ? body : body.slice(0, dotIdx);
  const codeToken = dotIdx === -1 ? '' : body.slice(dotIdx + 1);

  const profile = decodeDriverProfile(profileToken);
  if (!profile) return null;

  if (codeToken) {
    const check = validateActivationCode(codeToken, customCodes);
    return {
      profile,
      activationCode: check.valid ? check.normalizedCode : null,
    };
  }

  return { profile, activationCode: null };
}
