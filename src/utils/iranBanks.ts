import type { BankInfo } from '../types/driver';
import { onlyDigits, toPersianDigits } from './persianNumbers';

interface BankRule {
  prefixes: string[];
  info: BankInfo;
}

const BANK_RULES: BankRule[] = [
  {
    // BluBank (Saman neo-bank) specific 8-digit prefixes checked first
    prefixes: ['62198619', '62198610'],
    info: {
      id: 'blubank',
      name: 'بلوبانک (سامان)',
      shortName: 'بلوبانک',
      gradientFrom: '#1D4ED8',
      gradientTo: '#0F172A',
      accentColor: '#60A5FA',
      markText: 'blu',
    },
  },
  {
    prefixes: ['603799'],
    info: {
      id: 'melli',
      name: 'بانک ملی ایران',
      shortName: 'ملی',
      gradientFrom: '#B45309',
      gradientTo: '#1E293B',
      accentColor: '#FBBF24',
      markText: 'ملی',
    },
  },
  {
    prefixes: ['610433', '991975'],
    info: {
      id: 'mellat',
      name: 'بانک ملت',
      shortName: 'ملت',
      gradientFrom: '#991B1B',
      gradientTo: '#1E1B4B',
      accentColor: '#F87171',
      markText: 'ملت',
    },
  },
  {
    prefixes: ['621986'],
    info: {
      id: 'saman',
      name: 'بانک سامان',
      shortName: 'سامان',
      gradientFrom: '#0369A1',
      gradientTo: '#0F172A',
      accentColor: '#38BDF8',
      markText: 'سامان',
    },
  },
  {
    prefixes: ['603769'],
    info: {
      id: 'saderat',
      name: 'بانک صادرات ایران',
      shortName: 'صادرات',
      gradientFrom: '#1E3A8A',
      gradientTo: '#0F172A',
      accentColor: '#60A5FA',
      markText: 'صادرات',
    },
  },
  {
    prefixes: ['627353', '585983'],
    info: {
      id: 'tejarat',
      name: 'بانک تجارت',
      shortName: 'تجارت',
      gradientFrom: '#1D4ED8',
      gradientTo: '#1E293B',
      accentColor: '#93C5FD',
      markText: 'تجارت',
    },
  },
  {
    prefixes: ['589210'],
    info: {
      id: 'sepah',
      name: 'بانک سپه',
      shortName: 'سپه',
      gradientFrom: '#92400E',
      gradientTo: '#1E293B',
      accentColor: '#FCD34D',
      markText: 'سپه',
    },
  },
  {
    prefixes: ['502229', '639347'],
    info: {
      id: 'pasargad',
      name: 'بانک پاسارگاد',
      shortName: 'پاسارگاد',
      gradientFrom: '#334155',
      gradientTo: '#090D16',
      accentColor: '#F59E0B',
      markText: 'پاسارگاد',
    },
  },
  {
    prefixes: ['622106', '639194', '627884'],
    info: {
      id: 'parsian',
      name: 'بانک پارسیان',
      shortName: 'پارسیان',
      gradientFrom: '#854D0E',
      gradientTo: '#1C1917',
      accentColor: '#FBBF24',
      markText: 'پارسیان',
    },
  },
  {
    prefixes: ['628023'],
    info: {
      id: 'maskan',
      name: 'بانک مسکن',
      shortName: 'مسکن',
      gradientFrom: '#C2410C',
      gradientTo: '#1E293B',
      accentColor: '#FB923C',
      markText: 'مسکن',
    },
  },
  {
    prefixes: ['603770', '639217'],
    info: {
      id: 'keshavarzi',
      name: 'بانک کشاورزی',
      shortName: 'کشاورزی',
      gradientFrom: '#065F46',
      gradientTo: '#0F172A',
      accentColor: '#34D399',
      markText: 'کشاورزی',
    },
  },
  {
    prefixes: ['627412'],
    info: {
      id: 'eghtesad',
      name: 'بانک اقتصاد نوین',
      shortName: 'اقتصاد نوین',
      gradientFrom: '#5B21B6',
      gradientTo: '#0F172A',
      accentColor: '#C4B5FD',
      markText: 'اقتصاد نوین',
    },
  },
  {
    prefixes: ['636214'],
    info: {
      id: 'ayandeh',
      name: 'بانک آینده',
      shortName: 'آینده',
      gradientFrom: '#78350F',
      gradientTo: '#1E293B',
      accentColor: '#FBBF24',
      markText: 'آینده',
    },
  },
  {
    prefixes: ['502806', '504706'],
    info: {
      id: 'shahr',
      name: 'بانک شهر',
      shortName: 'شهر',
      gradientFrom: '#9F1239',
      gradientTo: '#0F172A',
      accentColor: '#FDA4AF',
      markText: 'شهر',
    },
  },
  {
    prefixes: ['502938'],
    info: {
      id: 'dey',
      name: 'بانک دی',
      shortName: 'دی',
      gradientFrom: '#0F766E',
      gradientTo: '#0F172A',
      accentColor: '#5EEAD4',
      markText: 'دی',
    },
  },
  {
    prefixes: ['639346'],
    info: {
      id: 'sina',
      name: 'بانک سینا',
      shortName: 'سینا',
      gradientFrom: '#1E40AF',
      gradientTo: '#0F172A',
      accentColor: '#93C5FD',
      markText: 'سینا',
    },
  },
  {
    prefixes: ['627488'],
    info: {
      id: 'karafarin',
      name: 'بانک کارآفرین',
      shortName: 'کارآفرین',
      gradientFrom: '#047857',
      gradientTo: '#0F172A',
      accentColor: '#6EE7B7',
      markText: 'کارآفرین',
    },
  },
  {
    prefixes: ['639607'],
    info: {
      id: 'sarmayeh',
      name: 'بانک سرمایه',
      shortName: 'سرمایه',
      gradientFrom: '#3730A3',
      gradientTo: '#0F172A',
      accentColor: '#A5B4FC',
      markText: 'سرمایه',
    },
  },
  {
    prefixes: ['589463'],
    info: {
      id: 'refah',
      name: 'بانک رفاه کارگران',
      shortName: 'رفاه',
      gradientFrom: '#0E7490',
      gradientTo: '#0F172A',
      accentColor: '#67E8F9',
      markText: 'رفاه',
    },
  },
  {
    prefixes: ['606373'],
    info: {
      id: 'mehr',
      name: 'بانک قرض‌الحسنه مهر ایران',
      shortName: 'مهر ایران',
      gradientFrom: '#065F46',
      gradientTo: '#1E293B',
      accentColor: '#34D399',
      markText: 'مهر',
    },
  },
  {
    prefixes: ['504172'],
    info: {
      id: 'resalat',
      name: 'بانک رسالت',
      shortName: 'رسالت',
      gradientFrom: '#0284C7',
      gradientTo: '#0F172A',
      accentColor: '#7DD3FC',
      markText: 'رسالت',
    },
  },
  {
    prefixes: ['627760'],
    info: {
      id: 'postbank',
      name: 'پست بانک ایران',
      shortName: 'پست بانک',
      gradientFrom: '#15803D',
      gradientTo: '#0F172A',
      accentColor: '#86EFAC',
      markText: 'پست بانک',
    },
  },
  {
    prefixes: ['502908'],
    info: {
      id: 'taavon',
      name: 'بانک توسعه تعاون',
      shortName: 'توسعه تعاون',
      gradientFrom: '#0369A1',
      gradientTo: '#1E293B',
      accentColor: '#38BDF8',
      markText: 'تعاون',
    },
  },
  {
    prefixes: ['505416'],
    info: {
      id: 'gardeshgari',
      name: 'بانک گردشگری',
      shortName: 'گردشگری',
      gradientFrom: '#991B1B',
      gradientTo: '#1E293B',
      accentColor: '#FCA5A5',
      markText: 'گردشگری',
    },
  },
  {
    prefixes: ['505785'],
    info: {
      id: 'iranzamin',
      name: 'بانک ایران زمین',
      shortName: 'ایران زمین',
      gradientFrom: '#6D28D9',
      gradientTo: '#0F172A',
      accentColor: '#DDD6FE',
      markText: 'ایران زمین',
    },
  },
  {
    prefixes: ['585947'],
    info: {
      id: 'khavarmianeh',
      name: 'بانک خاورمیانه',
      shortName: 'خاورمیانه',
      gradientFrom: '#0F766E',
      gradientTo: '#1E293B',
      accentColor: '#5EEAD4',
      markText: 'خاورمیانه',
    },
  },
];

export const UNKNOWN_BANK: BankInfo = {
  id: 'shetab',
  name: 'کارت بانکی عضو شتاب',
  shortName: 'عضو شتاب',
  gradientFrom: '#1E293B',
  gradientTo: '#0F172A',
  accentColor: '#10B981',
  markText: 'شتاب',
};

export function detectIranianBank(cardInput: string): BankInfo {
  const digits = onlyDigits(cardInput, 16);
  if (digits.length < 6) return UNKNOWN_BANK;

  // Check 8-digit prefixes first (e.g. BluBank), then 6-digit BINs
  for (const rule of BANK_RULES) {
    if (rule.prefixes.some((p) => p.length === 8 && digits.startsWith(p))) {
      return rule.info;
    }
  }
  for (const rule of BANK_RULES) {
    if (rule.prefixes.some((p) => p.length === 6 && digits.startsWith(p))) {
      return rule.info;
    }
  }

  return UNKNOWN_BANK;
}

export function formatCardGroups(cardInput: string, usePersianDigits = false): string {
  const digits = onlyDigits(cardInput, 16);
  const groups = digits.match(/.{1,4}/g) || [];
  const joined = groups.join(' - ');
  return usePersianDigits ? toPersianDigits(joined) : joined;
}

export function formatCardSpaced(cardInput: string, usePersianDigits = true): string {
  const digits = onlyDigits(cardInput, 16);
  const groups = digits.match(/.{1,4}/g) || [];
  const joined = groups.join('  ');
  return usePersianDigits ? toPersianDigits(joined) : joined;
}

export function isValidCardNumber(cardInput: string): boolean {
  const digits = onlyDigits(cardInput);
  return digits.length === 16;
}
