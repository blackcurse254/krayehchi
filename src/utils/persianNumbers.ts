const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toEnglishDigits(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const pIdx = PERSIAN_DIGITS.indexOf(ch);
    if (pIdx !== -1) {
      out += String(pIdx);
      continue;
    }
    const aIdx = ARABIC_DIGITS.indexOf(ch);
    if (aIdx !== -1) {
      out += String(aIdx);
      continue;
    }
    out += ch;
  }
  return out;
}

export function toPersianDigits(input: string | number): string {
  const str = String(input);
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 48 && code <= 57) {
      out += PERSIAN_DIGITS[code - 48];
    } else {
      out += str[i];
    }
  }
  return out;
}

export function onlyDigits(input: string, maxLength?: number): string {
  const normalized = toEnglishDigits(input).replace(/\D/g, '');
  return typeof maxLength === 'number' ? normalized.slice(0, maxLength) : normalized;
}

export function formatToman(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '۰';
  const rounded = Math.floor(amount);
  const withCommas = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '،');
  return toPersianDigits(withCommas);
}

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد'];

function threeDigitToWords(n: number): string {
  if (n === 0) return '';
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h > 0) parts.push(HUNDREDS[h]);
  if (rem >= 10 && rem < 20) {
    parts.push(TEENS[rem - 10]);
  } else {
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (t > 0) parts.push(TENS[t]);
    if (o > 0) parts.push(ONES[o]);
  }
  return parts.join(' و ');
}

export function numberToPersianWords(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return 'صفر تومان';
  let num = Math.floor(amount);
  if (num >= 1_000_000_000_000) {
    return `${formatToman(num)} تومان`;
  }

  const groups: string[] = [];
  let scaleIndex = 0;
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk > 0) {
      const words = threeDigitToWords(chunk);
      const scale = SCALES[scaleIndex];
      groups.unshift(scale ? `${words} ${scale}` : words);
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return `${groups.join(' و ')} تومان`;
}

export function formatJalaliDateTime(date: Date = new Date()): {
  dateText: string;
  timeText: string;
} {
  try {
    const dateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return {
      dateText: dateFormatter.format(date),
      timeText: timeFormatter.format(date),
    };
  } catch {
    return {
      dateText: toPersianDigits(date.toLocaleDateString('en-CA')),
      timeText: toPersianDigits(date.toTimeString().slice(0, 8)),
    };
  }
}
