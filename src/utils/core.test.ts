import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toEnglishDigits,
  toPersianDigits,
  onlyDigits,
  formatToman,
  numberToPersianWords,
  formatJalaliDateTime,
} from './persianNumbers';
import {
  detectIranianBank,
  formatCardGroups,
  isValidCardNumber,
} from './iranBanks';
import {
  encodeDriverProfile,
  decodeDriverProfile,
  buildPassengerShareUrl,
  sanitizeGatewayUrl,
} from './urlCodec';
import { validateDriverProfile, isDriverProfileValid } from './driverValidation';
import type { DriverProfile } from '../types/driver';

test('persianNumbers normalizes Persian/Arabic digits and formats Toman', () => {
  assert.equal(toEnglishDigits('۶۰۳۷۹۹۱۲۳۴۵۶۷۸۹۰'), '6037991234567890');
  assert.equal(toPersianDigits('50000'), '۵۰۰۰۰');
  assert.equal(onlyDigits('۶۰۳۷-۹۹۷۱-۱۲۳۴-۵۶۷۸', 16), '6037997112345678');
  assert.equal(formatToman(50000), '۵۰،۰۰۰');
  assert.equal(formatToman(0), '۰');
});

test('numberToPersianWords converts amounts accurately', () => {
  assert.equal(numberToPersianWords(0), 'صفر تومان');
  assert.equal(numberToPersianWords(10000), 'ده هزار تومان');
  assert.equal(numberToPersianWords(50000), 'پنجاه هزار تومان');
  assert.equal(numberToPersianWords(125000), 'یکصد و بیست و پنج هزار تومان');
  assert.equal(numberToPersianWords(1250000), 'یک میلیون و دویست و پنجاه هزار تومان');
});

test('formatJalaliDateTime produces non-empty Persian calendar text', () => {
  const res = formatJalaliDateTime(new Date('2026-03-21T10:30:00Z'));
  assert.ok(res.dateText.length > 4);
  assert.ok(res.timeText.length >= 4);
});

test('detectIranianBank identifies major Iranian BINs and BluBank 8-digit prefix', () => {
  assert.equal(detectIranianBank('6037997100001234').id, 'melli');
  assert.equal(detectIranianBank('6104337100001234').id, 'mellat');
  assert.equal(detectIranianBank('6219861012345678').id, 'blubank');
  assert.equal(detectIranianBank('6219865512345678').id, 'saman');
  assert.equal(detectIranianBank('6221061234567890').id, 'parsian');
  assert.equal(detectIranianBank('5022291234567890').id, 'pasargad');
  assert.equal(detectIranianBank('9999991234567890').id, 'shetab');
  assert.equal(formatCardGroups('6037997100458219', false), '6037 - 9971 - 0045 - 8219');
  assert.equal(isValidCardNumber('6037997100458219'), true);
  assert.equal(isValidCardNumber('603799710045'), false);
});

test('urlCodec encodes and decodes Persian UTF-8 DriverProfile round-trip', () => {
  const sample: DriverProfile = {
    name: 'علی رضایی',
    carModel: 'پژو پارس سفید',
    plate: { left2: '24', letter: 'ت', right3: '583', iranCode: '66' },
    cardNumber: '6104337100458219',
    fareMode: 'fixed',
    fixedAmount: 75000,
    gatewayUrl: 'payping.ir/d/taxi48',
  };

  const encoded = encodeDriverProfile(sample);
  assert.ok(encoded.length > 10);
  const decoded = decodeDriverProfile(encoded);
  assert.ok(decoded !== null);
  assert.equal(decoded.name, sample.name);
  assert.equal(decoded.carModel, sample.carModel);
  assert.deepEqual(decoded.plate, sample.plate);
  assert.equal(decoded.cardNumber, sample.cardNumber);
  assert.equal(decoded.fareMode, 'fixed');
  assert.equal(decoded.fixedAmount, 75000);
  assert.equal(decoded.gatewayUrl, 'https://payping.ir/d/taxi48');

  const url = buildPassengerShareUrl(sample, 'https://kerayehchi.app/');
  assert.ok(url.startsWith('https://kerayehchi.app/?d='));
});

test('urlCodec rejects malformed input and unsafe protocols', () => {
  assert.equal(decodeDriverProfile('not-valid-base64!!!'), null);
  assert.equal(decodeDriverProfile(''), null);
  assert.equal(sanitizeGatewayUrl('javascript:alert(1)'), '');
});

test('validateDriverProfile enforces required fields strictly', () => {
  const invalid: DriverProfile = {
    name: '',
    carModel: 'a',
    plate: { left2: '1', letter: 'ت', right3: '12', iranCode: '1' },
    cardNumber: '603799',
    fareMode: 'fixed',
    fixedAmount: 500,
    gatewayUrl: 'javascript:evil()',
  };
  const errs = validateDriverProfile(invalid);
  assert.ok(errs.name);
  assert.ok(errs.carModel);
  assert.ok(errs.plate);
  assert.ok(errs.cardNumber);
  assert.ok(errs.fixedAmount);
  assert.ok(errs.gatewayUrl);
  assert.equal(isDriverProfileValid(invalid), false);
});
