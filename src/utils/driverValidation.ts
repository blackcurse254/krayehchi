import type { DriverProfile } from '../types/driver';
import { isValidCardNumber } from './iranBanks';
import { onlyDigits } from './persianNumbers';
import { sanitizeGatewayUrl } from './urlCodec';

export interface DriverValidationErrors {
  name?: string;
  carModel?: string;
  plate?: string;
  cardNumber?: string;
  fixedAmount?: string;
  gatewayUrl?: string;
}

export function validateDriverProfile(profile: DriverProfile): DriverValidationErrors {
  const errors: DriverValidationErrors = {};

  if (!profile.name.trim() || profile.name.trim().length < 2) {
    errors.name = 'لطفاً نام و نام خانوادگی راننده را وارد کنید.';
  }

  if (!profile.carModel.trim() || profile.carModel.trim().length < 2) {
    errors.carModel = 'مدل و رنگ خودرو را وارد کنید (مثلاً پژو پارس سفید).';
  }

  const l2 = onlyDigits(profile.plate.left2);
  const r3 = onlyDigits(profile.plate.right3);
  const ic = onlyDigits(profile.plate.iranCode);
  if (l2.length !== 2 || !profile.plate.letter.trim() || r3.length !== 3 || ic.length !== 2) {
    errors.plate = 'پلاک خودرو باید کامل باشد (۲ رقم، حرف، ۳ رقم، کد ایران ۲ رقم).';
  }

  if (!isValidCardNumber(profile.cardNumber)) {
    errors.cardNumber = 'شماره کارت باید دقیقاً ۱۶ رقم باشد.';
  }

  if (profile.fareMode === 'fixed') {
    if (!Number.isFinite(profile.fixedAmount) || profile.fixedAmount < 1000) {
      errors.fixedAmount = 'مبلغ کرایه ثابت باید حداقل ۱٬۰۰۰ تومان باشد.';
    }
  }

  if (profile.gatewayUrl.trim() && !sanitizeGatewayUrl(profile.gatewayUrl)) {
    errors.gatewayUrl = 'لینک درگاه پرداخت معتبر نیست (مثال: https://payping.ir/...).';
  }

  return errors;
}

export function isDriverProfileValid(profile: DriverProfile): boolean {
  return Object.keys(validateDriverProfile(profile)).length === 0;
}
