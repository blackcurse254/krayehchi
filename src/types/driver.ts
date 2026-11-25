export type AppMode = 'driver' | 'passenger';

export type FareMode = 'variable' | 'fixed';

export type SubscriptionPlan = '1m' | '3m' | '1y';

export interface SubscriptionState {
  isActive: boolean;
  code: string;
  planLabel: string;
  activatedAt: string;
}

export interface LicensePlate {
  left2: string;
  letter: string;
  right3: string;
  iranCode: string;
}

export interface DriverProfile {
  name: string;
  carModel: string;
  plate: LicensePlate;
  cardNumber: string; // 16 ASCII digits
  fareMode: FareMode;
  fixedAmount: number; // Toman
  gatewayUrl: string;
}

export interface BankInfo {
  id: string;
  name: string;
  shortName: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  markText: string;
}

export const PERSIAN_PLATE_LETTERS = [
  'ت', // تاکسی
  'ع', // عمومی
  'ب',
  'ج',
  'د',
  'س',
  'ص',
  'ط',
  'ق',
  'ل',
  'م',
  'ن',
  'و',
  'ه',
  'ی',
] as const;

export const DEFAULT_DEMO_DRIVER: DriverProfile = {
  name: 'رضا محمدی',
  carModel: 'سمند سورن پلاس زرد',
  plate: {
    left2: '48',
    letter: 'ت',
    right3: '724',
    iranCode: '11',
  },
  cardNumber: '6037997100458219',
  fareMode: 'variable',
  fixedAmount: 50000,
  gatewayUrl: '',
};
