import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react';
import type { DriverProfile } from '../types/driver';
import { detectIranianBank } from '../utils/iranBanks';
import { formatToman, numberToPersianWords, onlyDigits, toPersianDigits } from '../utils/persianNumbers';
import { isDriverProfileValid } from '../utils/driverValidation';
import { sanitizeGatewayUrl } from '../utils/urlCodec';
import { triggerHaptic } from '../utils/audioChime';
import { IranianPlateBadge } from './IranianPlateBadge';
import { BankCard3D } from './BankCard3D';

interface PassengerPanelProps {
  profile: DriverProfile | null;
  isInvalidUrlParam: boolean;
  onShowToast: (message: string, tone?: 'success' | 'error') => void;
  onSwitchToDriver: () => void;
  onOpenReceipt: (amount: number) => void;
}

const QUICK_ADD_AMOUNTS = [10000, 20000, 50000] as const;

interface BankingAppItem {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  accent: string;
}

const BANKING_APPS: BankingAppItem[] = [
  {
    id: 'ap',
    name: 'آپ',
    subtitle: 'کارت‌به‌کارت ۷۳۳',
    href: 'https://app.733.ir',
    accent: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
  },
  {
    id: 'hamrahbank',
    name: 'همراه بانک',
    subtitle: 'اپلیکیشن بانک شما',
    href: '#copy-card-guide',
    accent: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    id: 'sekeh',
    name: 'سکه',
    subtitle: 'به‌پرداخت ملت',
    href: 'https://sekeh.behpardakht.com',
    accent: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  },
  {
    id: 'top',
    name: 'تاپ',
    subtitle: 'سوپراپ پرداخت',
    href: 'https://top.ir',
    accent: 'text-sky-300 border-sky-500/30 bg-sky-500/10',
  },
];

export const PassengerPanel: React.FC<PassengerPanelProps> = ({
  profile,
  isInvalidUrlParam,
  onShowToast,
  onSwitchToDriver,
  onOpenReceipt,
}) => {
  const [fareInput, setFareInput] = useState<string>(() =>
    profile && profile.fareMode === 'fixed' ? String(profile.fixedAmount) : '50000'
  );
  const [fareError, setFareError] = useState<string>('');

  const isProfileReady = profile !== null && isDriverProfileValid(profile);
  const effectiveAmount = useMemo(() => {
    if (!profile) return 0;
    if (profile.fareMode === 'fixed') return profile.fixedAmount;
    return fareInput ? parseInt(fareInput, 10) || 0 : 0;
  }, [profile, fareInput]);

  const detectedBank = useMemo(
    () => detectIranianBank(profile?.cardNumber ?? ''),
    [profile?.cardNumber]
  );

  const safeGatewayUrl = useMemo(
    () => (profile ? sanitizeGatewayUrl(profile.gatewayUrl) : ''),
    [profile]
  );

  if (!isProfileReady || !profile) {
    return (
      <section className="mx-auto flex min-h-[70dvh] max-w-xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/75 p-6 sm:p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-extrabold text-white">
            {isInvalidUrlParam
              ? 'لینک پرداخت راننده معتبر نیست'
              : 'اطلاعات راننده هنوز تکمیل نشده است'}
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {isInvalidUrlParam
              ? 'کد QR اسکن‌شده ناقص است. لطفاً دوباره کد داخل تاکسی را اسکن کنید یا از پنل راننده کارت جدید بسازید.'
              : 'برای نمایش نمای مسافر، ابتدا در پنل راننده مشخصات خودرو و شماره کارت ۱۶ رقمی را وارد کنید.'}
          </p>
          <button
            type="button"
            onClick={onSwitchToDriver}
            className="mt-6 min-h-[48px] w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            رفتن به پنل راننده
          </button>
        </div>
      </section>
    );
  }

  const copyRawCardNumber = async (customMessage?: string) => {
    const rawCard = onlyDigits(profile.cardNumber, 16);
    try {
      await navigator.clipboard.writeText(rawCard);
      triggerHaptic(30);
      onShowToast(customMessage || 'شماره کارت ۱۶ رقمی بدون خط تیره کپی شد.');
    } catch {
      onShowToast(`شماره کارت: ${rawCard}`, 'error');
    }
  };

  const handleFareChange = (raw: string) => {
    setFareError('');
    setFareInput(onlyDigits(raw, 9));
  };

  const handleQuickAdd = (delta: number) => {
    setFareError('');
    const current = fareInput ? parseInt(fareInput, 10) || 0 : 0;
    setFareInput(String(current + delta));
    triggerHaptic(15);
  };

  const handleConfirmPaid = () => {
    if (effectiveAmount < 1000) {
      setFareError('لطفاً مبلغ کرایه را حداقل ۱٬۰۰۰ تومان وارد کنید.');
      onShowToast('لطفاً مبلغ کرایه پرداخت‌شده را وارد کنید.', 'error');
      return;
    }
    setFareError('');
    onOpenReceipt(effectiveAmount);
  };

  const formattedFareInput = useMemo(() => {
    if (!fareInput) return '';
    return fareInput.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }, [fareInput]);

  return (
    <section
      aria-label="صفحه پرداخت مسافر"
      className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:py-8"
    >
      {/* 1. Driver Verification Header */}
      <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-semibold">
                <span>اطلاعات اعلام‌شده توسط راننده</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-400">{detectedBank.name}</span>
              </div>
              <h1 className="mt-0.5 text-lg sm:text-xl font-extrabold text-white">
                {profile.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">{profile.carModel}</p>
            </div>
          </div>

          <div className="flex justify-start sm:justify-end">
            <IranianPlateBadge plate={profile.plate} size="md" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Workspace (ordered chronologically on mobile) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
        {/* 2. Fare Input / Display Card */}
        <div className="order-1 lg:col-span-6 lg:col-start-1 rounded-3xl border border-slate-800 bg-slate-900/65 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Wallet className="h-4 w-4 text-amber-400" />
              <span>
                {profile.fareMode === 'fixed' ? 'کرایه تعیین‌شده راننده' : 'مبلغ کرایه (تومان)'}
              </span>
            </h2>
            {profile.fareMode === 'variable' && (
              <button
                type="button"
                onClick={() => handleFareChange('')}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                صفر کردن
              </button>
            )}
          </div>

          {profile.fareMode === 'fixed' ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                {formatToman(effectiveAmount)}{' '}
                <span className="text-base font-bold text-emerald-300">تومان</span>
              </div>
              <p className="mt-2 text-sm font-medium text-emerald-200">
                {numberToPersianWords(effectiveAmount)}
              </p>
            </div>
          ) : (
            <div>
              <div className="relative">
                <input
                  id="passenger-fare"
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  aria-label="مبلغ کرایه به تومان"
                  value={formattedFareInput}
                  onChange={(e) => handleFareChange(e.target.value)}
                  placeholder="50,000"
                  className={`min-h-[60px] w-full rounded-2xl border bg-slate-950/80 px-4 pl-20 text-center font-mono text-2xl sm:text-3xl font-extrabold text-white placeholder:text-slate-600 focus:outline-none tabular-nums transition-colors ${
                    fareError
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-700/80 focus:border-emerald-400'
                  }`}
                />
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                  تومان
                </span>
              </div>

              {/* Live Toman formatting & Persian words */}
              <div className="mt-3 flex flex-col gap-1 rounded-2xl bg-slate-950/50 px-4 py-3 text-center">
                <div className="text-base font-bold text-white tabular-nums">
                  {formatToman(effectiveAmount)} تومان
                </div>
                <div className="text-xs sm:text-sm font-medium text-emerald-300">
                  {numberToPersianWords(effectiveAmount)}
                </div>
              </div>

              {fareError && <p className="mt-2 text-xs text-rose-400">{fareError}</p>}

              {/* Quick-Select Chips */}
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {QUICK_ADD_AMOUNTS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleQuickAdd(chip)}
                    className="min-h-[48px] flex items-center justify-center gap-1 rounded-2xl border border-slate-700/80 bg-slate-800/80 px-2 py-2 text-xs sm:text-sm font-bold text-slate-100 hover:border-amber-400/50 hover:bg-slate-700/80 active:scale-[0.97] transition-all tabular-nums cursor-pointer"
                  >
                    <span dir="ltr">+{toPersianDigits((chip / 1000).toString())}</span>
                    <span>هزار</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. 1-Tap 3D Bank Card (appears right below Fare on mobile, right column on desktop) */}
        <div className="order-2 lg:col-span-6 lg:col-start-7 lg:row-start-1 rounded-3xl border border-slate-800 bg-slate-900/65 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <span>پرداخت کارت‌به‌کارت (روش اصلی)</span>
            </h2>
            <span className="text-xs text-slate-400">لمس کارت = کپی فوری</span>
          </div>

          <BankCard3D
            cardNumber={profile.cardNumber}
            holderName={profile.name}
            onCopyClick={() => copyRawCardNumber()}
          />

          <button
            type="button"
            onClick={() => copyRawCardNumber()}
            className="mt-4 min-h-[52px] flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Copy className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
            <span>کپی شماره کارت</span>
          </button>
        </div>

        {/* 4. Quick Banking App Launcher + Optional Gateway */}
        <div className="order-3 lg:col-span-6 lg:col-start-1 space-y-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/65 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
            <div className="mb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <Smartphone className="h-4 w-4 text-sky-400" />
                <span>انتقال سریع با اپلیکیشن‌های بانکی</span>
              </h2>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                با لمس هر گزینه، شماره کارت راننده کپی می‌شود؛ در اندروید و iOS وارد برنامه شده و شماره کارت را جایگذاری (Paste) کنید.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {BANKING_APPS.map((app) =>
                app.href.startsWith('#') ? (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() =>
                      copyRawCardNumber(
                        `شماره کارت کپی شد؛ اکنون برنامه ${app.name} گوشی خود را باز کنید.`
                      )
                    }
                    className={`min-h-[60px] flex flex-col items-start justify-center rounded-2xl border px-4 py-3 text-right transition-transform active:scale-[0.97] cursor-pointer ${app.accent}`}
                  >
                    <span className="text-sm font-extrabold">{app.name}</span>
                    <span className="mt-0.5 text-[11px] opacity-85">{app.subtitle}</span>
                  </button>
                ) : (
                  <a
                    key={app.id}
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      copyRawCardNumber(
                        `شماره کارت کپی شد؛ در حال باز کردن ${app.name}...`
                      )
                    }
                    className={`min-h-[60px] flex flex-col items-start justify-center rounded-2xl border px-4 py-3 text-right transition-transform active:scale-[0.97] ${app.accent}`}
                  >
                    <span className="text-sm font-extrabold">{app.name}</span>
                    <span className="mt-0.5 text-[11px] opacity-85">{app.subtitle}</span>
                  </a>
                )
              )}
            </div>
          </div>

          {safeGatewayUrl && (
            <a
              href={safeGatewayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[54px] flex w-full items-center justify-center gap-2.5 rounded-2xl border border-amber-400/40 bg-gradient-to-l from-amber-500/20 to-amber-600/10 px-5 py-3.5 text-sm font-bold text-amber-200 hover:from-amber-500/30 hover:to-amber-600/20 transition-all shadow-lg"
            >
              <ExternalLink className="h-4.5 w-4.5 text-amber-400 shrink-0" />
              <span>پرداخت آنلاین با درگاه (رمز پویا)</span>
            </a>
          )}
        </div>

        {/* 5. Primary Confirmation CTA (last on mobile, right below 3D card on desktop) */}
        <div className="order-4 lg:col-span-6 lg:col-start-7 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5">
          <p className="mb-3 text-xs text-slate-300 leading-relaxed">
            پس از انتقال وجه، دکمه زیر را لمس کنید تا صفحه نمایش پرداخت برای راننده باز شود.
          </p>
          <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
            هنگام کارت‌به‌کارت، نام گیرنده‌ای که اپ بانک نشان می‌دهد را با نام راننده و پلاک خودرو مقایسه کنید. این صفحه تأیید بانکی نیست؛ راننده باید پیامک بانک را بررسی کند.
          </p>
          <button
            type="button"
            onClick={handleConfirmPaid}
            className="min-h-[56px] flex w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 px-5 py-3.5 text-base font-extrabold text-slate-950 shadow-xl shadow-emerald-500/25 hover:bg-emerald-400 active:scale-[0.98] transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>پرداخت کردم / نمایش به راننده</span>
          </button>
        </div>
      </div>
    </section>
  );
};
