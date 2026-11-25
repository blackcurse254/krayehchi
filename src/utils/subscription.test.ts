import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ADMIN_PIN,
  generateActivationCode,
  validateActivationCode,
  encodeTransferCode,
  decodeTransferCode,
  normalizeActivationCode,
} from './subscription';
import { DEFAULT_DEMO_DRIVER } from '../types/driver';

test('DEFAULT_ADMIN_PIN is strictly 2026', () => {
  assert.equal(DEFAULT_ADMIN_PIN, '2026');
});

test('generateActivationCode creates valid deterministic checksum codes for each plan', () => {
  const c1m = generateActivationCode('1m');
  const c3m = generateActivationCode('3m');
  const c1y = generateActivationCode('1y');

  assert.match(c1m, /^KC-1M[A-Z0-9]{2}-[A-Z0-9]{4}$/);
  assert.match(c3m, /^KC-3M[A-Z0-9]{2}-[A-Z0-9]{4}$/);
  assert.match(c1y, /^KC-1Y[A-Z0-9]{2}-[A-Z0-9]{4}$/);

  const v1 = validateActivationCode(c1m);
  const v3 = validateActivationCode(c3m);
  const vY = validateActivationCode(c1y);

  assert.equal(v1.valid, true);
  assert.equal(v1.planLabel, 'اشتراک ۱ ماهه');
  assert.equal(v3.valid, true);
  assert.equal(v3.planLabel, 'اشتراک ۳ ماهه');
  assert.equal(vY.valid, true);
  assert.equal(vY.planLabel, 'اشتراک ۱ ساله');
});

test('validateActivationCode rejects tampered checksums and accepts custom codes, Persian digits, en-dashes, and missing hyphens', () => {
  const code = generateActivationCode('1m');
  // Tamper the last checksum char
  const lastChar = code[code.length - 1];
  const tampered = code.slice(0, -1) + (lastChar === 'A' ? 'B' : 'A');
  assert.equal(validateActivationCode(tampered).valid, false);
  assert.equal(validateActivationCode('INVALID-CODE').valid, false);

  // Persian digits in code should normalize properly
  const withPersianDigits = code.replace(/1/g, '۱').replace(/3/g, '۳').toLowerCase();
  assert.equal(normalizeActivationCode(withPersianDigits), code);
  assert.equal(validateActivationCode(withPersianDigits).valid, true);

  // En-dash and missing hyphens should normalize properly
  assert.equal(validateActivationCode(code.replace(/-/g, '–')).valid, true);
  assert.equal(validateActivationCode(code.replace(/-/g, '')).valid, true);

  // Custom localStorage code support
  const custom = [{ code: 'VIP-TAXI-99', planLabel: 'اشتراک طلایی' }];
  const customCheck = validateActivationCode('vip-taxi-99', custom);
  assert.equal(customCheck.valid, true);
  assert.equal(customCheck.source, 'custom');
  assert.equal(customCheck.planLabel, 'اشتراک طلایی');
});

test('encodeTransferCode and decodeTransferCode round-trip driver profile and subscription code', () => {
  const code = generateActivationCode('3m');
  const transfer = encodeTransferCode(DEFAULT_DEMO_DRIVER, code);
  assert.ok(transfer.startsWith('KCT1:'));

  const decoded = decodeTransferCode(transfer);
  assert.ok(decoded !== null);
  assert.equal(decoded.profile.name, DEFAULT_DEMO_DRIVER.name);
  assert.equal(decoded.profile.cardNumber, DEFAULT_DEMO_DRIVER.cardNumber);
  assert.equal(decoded.activationCode, code);
});

test('decodeTransferCode handles malformed strings safely', () => {
  assert.equal(decodeTransferCode(''), null);
  assert.equal(decodeTransferCode('KCT1:not-valid-base64!!!'), null);
});
