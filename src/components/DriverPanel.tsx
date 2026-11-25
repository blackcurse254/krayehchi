import React, { useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Car,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Link2,
  Lock,
  RotateCcw,
  Sparkles,
  User,
} from 'lucide-react';
import { DEFAULT_DEMO_DRIVER, type DriverProfile, type SubscriptionState } from '../types/driver';
import { detectIranianBank, formatCardGroups } from '../utils/iranBanks';
import { formatToman, numberToPersianWords, onlyDigits } from '../utils/persianNumbers';
import { validateDriverProfile } from '../utils/driverValidation';
import { buildPassengerShareUrl } from '../utils/urlCodec';
import { exportDriverQrStickerPng } from '../utils/qrStickerExport';
import { triggerHaptic } from '../utils/audioChime';
import { IranianPlateBadge, IranianPlateInput } from './IranianPlateBadge';
import { DriverInstallBanner } from './PWAInstallButton';
import { SubscriptionCard } from './SubscriptionCard';

interface DriverPanelProps {
  profile: DriverProfile;
  subscription: SubscriptionState;
  onChange: (next: DriverProfile) => void;
  onActivateCode: (code: string) => { ok: boolean; message: string };
  onImportTransferCode: (transferStr: string) => { ok: boolean; message: string };
  onDeactivateSubscription: () => void;
  onOpenAdmin: () => void;
  onShowToast: (message: string, tone?: 'success' | 'error') => void;
  onPreviewPassenger: () => void;
}

export const DriverPanel: React.FC<DriverPanelProps> = ({
  profile,
  subscription,
  onChange,
  onActivateCode,
  onImportTransferCode,
  onDeactivateSubscription,
  onOpenAdmin,
  onShowToast,
  onPreviewPassenger,
}) => {
  const [showErrors, setShowErrors] = useState(false);
  const [cardTilt, setCardTilt] = useState({ rx: 0, ry: 0 });
  const qrWrapperRef = useRef<HTMLDivElement | null>(null);
  const activationInputRef = useRef<HTMLInputElement | null>(null);

  const errors = useMemo(() => validateDriverProfile(profile), [profile]);
  const isValid = Object.keys(errors).length === 0;
  const detectedBank = useMemo(() => detectIranianBank(profile.cardNumber), [profile.cardNumber]);

  const shareUrl = useMemo(() => {
    if (!isValid || typeof window === 'undefined') return '';
    return buildPassengerShareUrl(profile, window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, ''));
  }, [isValid, profile]);

  const formattedCardDisplay = useMemo(
    () => formatCardGroups(profile.cardNumber, false),
    [profile.cardNumber]
  );

  const handleCardInput = (raw: string) => {
    const digits = onlyDigits(raw, 16);
    onChange({ ...profile, cardNumber: digits });
  };

  const handleFixedAmountInput = (raw: string) => {
    const digits = onlyDigits(raw, 9);
    const num = digits ? parseInt(digits, 10) : 0;
    onChange({ ...profile, fixedAmount: num });
  };

  const promptSubscriptionActivation = () => {
    onShowToast('برای دانلود برچسب و کپی لینک پرداخت، ابتدا اشتراک را فعال کنید.', 'error');
    activationInputRef.current?.focus();
    activationInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCopyLink = async () => {
    if (!subscription.isActive) {
      promptSubscriptionActivation();
      return;
    }
    setShowErrors(true);
    if (!isValid || !shareUrl) {
      onShowToast('لطفاً ابتدا تمام فیلدهای الزامی راننده را صحیح تکمیل کنید.', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      triggerHaptic(25);
      onShowToast('لینک پرداخت اختصاصی شما کپی شد.');
    } catch {
      onShowToast('امکان کپی خودکار نبود؛ لینک از نوار آدرس قابل کپی است.', 'error');
    }
  };

  const handleDownloadPng = async () => {
    if (!subscription.isActive) {
      promptSubscriptionActivation();
      return;
    }
    setShowErrors(true);
    if (!isValid) {
      onShowToast('برای دانلود برچسب، اطلاعات خودرو و شماره کارت را کامل کنید.', 'error');
      return;
    }

    const canvasEl = qrWrapperRef.current?.querySelector('canvas') ?? null;
    const ok = await exportDriverQrStickerPng(profile, canvasEl);
    if (ok) {
      triggerHaptic(30);
      onShowToast('تصویر برچسب QR با کیفیت چاپ دانلود شد.');
    } else {
      onShowToast('خطا در تولید تصویر برچسب؛ دوباره تلاش کنید.', 'error');
    }
  };

  const handleClearForm = () => {
    setShowErrors(false);
    onChange({
      name: '',
      carModel: '',
      plate: { left2: '', letter: 'ت', right3: '', iranCode: '' },
      cardNumber: '',
      fareMode: 'variable',
      fixedAmount: 50000,
      gatewayUrl: '',
    });
    onShowToast('فرم پاک شد؛ مشخصات خودتان را وارد کنید.');
  };

  const handleFillDemo = () => {
    setShowErrors(false);
    onChange(DEFAULT_DEMO_DRIVER);
    onShowToast('اطلاعات نمونه راننده تاکسی بارگذاری شد.');
  };

  const handleCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setCardTilt({
      rx: (0.5 - py) * 9,
      ry: (px - 0.5) * 10,
    });
  };

  return (
    <section
      aria-label="پنل تنظیمات راننده"
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8"
    >
      {/* Top intro row */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            کارت پرداخت هوشمند راننده
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            مشخصات تاکسی و شماره کارت را یک‌بار وارد کنید؛ اطلاعات به‌صورت خودکار روی دستگاه شما ذخیره می‌شود.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleFillDemo}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>نمونه تاکسی</span>
          </button>
          <button
            type="button"
            onClick={handleClearForm}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>پاک کردن فرم</span>
          </button>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
            aria-label="ورود ادمین"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>ورود ادمین</span>
          </button>
        </div>
      </div>

      {/* Subscription Status & Activation Card */}
      <SubscriptionCard
        subscription={subscription}
        onActivateCode={onActivateCode}
        onImportTransferCode={onImportTransferCode}
        onDeactivate={onDeactivateSubscription}
        activationInputRef={activationInputRef}
      />

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left/Right Form Column (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/65 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
          <div className="space-y-5">
            {/* Driver Name & Car Model */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="driver-name"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <User className="h-3.5 w-3.5 text-emerald-400" />
                  <span>نام و نام خانوادگی راننده</span>
                </label>
                <input
                  id="driver-name"
                  type="text"
                  value={profile.name}
                  onChange={(e) => onChange({ ...profile, name: e.target.value })}
                  placeholder="مثلاً: رضا محمدی"
                  className={`min-h-[48px] w-full rounded-2xl border bg-slate-950/70 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
                    showErrors && errors.name
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-700/80 focus:border-emerald-400'
                  }`}
                />
                {showErrors && errors.name && (
                  <p className="mt-1.5 text-xs text-rose-400">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="car-model"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <Car className="h-3.5 w-3.5 text-amber-400" />
                  <span>مدل و رنگ خودرو</span>
                </label>
                <input
                  id="car-model"
                  type="text"
                  value={profile.carModel}
                  onChange={(e) => onChange({ ...profile, carModel: e.target.value })}
                  placeholder="مثلاً: پژو پارس سفید"
                  className={`min-h-[48px] w-full rounded-2xl border bg-slate-950/70 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
                    showErrors && errors.carModel
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-700/80 focus:border-emerald-400'
                  }`}
                />
                {showErrors && errors.carModel && (
                  <p className="mt-1.5 text-xs text-rose-400">{errors.carModel}</p>
                )}
              </div>
            </div>

            {/* License Plate */}
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-300">
                پلاک خودرو (مطابق کارت ماشین)
              </span>
              <IranianPlateInput
                plate={profile.plate}
                onChange={(plate) => onChange({ ...profile, plate })}
                hasError={Boolean(showErrors && errors.plate)}
              />
              {showErrors && errors.plate && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.plate}</p>
              )}
            </div>

            {/* 16-digit Bank Card Number + Auto BIN Detection */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="card-number"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"
                >
                  <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                  <span>شماره کارت ۱۶ رقمی بانکی</span>
                </label>

                <span
                  className="text-xs font-semibold transition-colors"
                  style={{ color: detectedBank.accentColor }}
                >
                  {profile.cardNumber.length >= 6 ? detectedBank.name : 'تشخیص خودکار بانک'}
                </span>
              </div>

              <div className="relative">
                <input
                  id="card-number"
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={formattedCardDisplay}
                  onChange={(e) => handleCardInput(e.target.value)}
                  placeholder="6037 - 9971 - 0000 - 0000"
                  className={`min-h-[52px] w-full rounded-2xl border bg-slate-950/70 px-4 pl-24 text-center font-mono text-base sm:text-lg font-bold tracking-wider text-white placeholder:text-slate-600 focus:outline-none tabular-nums transition-colors ${
                    showErrors && errors.cardNumber
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-700/80 focus:border-emerald-400'
                  }`}
                />
                <span
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded-lg border border-white/15 px-2.5 py-1 text-xs font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${detectedBank.gradientFrom}, ${detectedBank.gradientTo})`,
                  }}
                >
                  {detectedBank.shortName}
                </span>
              </div>
              {showErrors && errors.cardNumber && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.cardNumber}</p>
              )}
            </div>

            {/* Fare Mode Toggle */}
            <div className="border-t border-slate-800/90 pt-5">
              <span className="mb-2 block text-xs font-semibold text-slate-300">
                نحوه تعیین مبلغ کرایه
              </span>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-1.5">
                <button
                  type="button"
                  onClick={() => onChange({ ...profile, fareMode: 'variable' })}
                  aria-pressed={profile.fareMode === 'variable'}
                  className={`min-h-[44px] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    profile.fareMode === 'variable'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  مبلغ دلخواه مسافر
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...profile, fareMode: 'fixed' })}
                  aria-pressed={profile.fareMode === 'fixed'}
                  className={`min-h-[44px] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    profile.fareMode === 'fixed'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  مبلغ ثابت کرایه
                </button>
              </div>

              {profile.fareMode === 'fixed' && (
                <div className="mt-3.5">
                  <label
                    htmlFor="fixed-fare"
                    className="mb-1.5 block text-xs font-semibold text-slate-300"
                  >
                    مبلغ کرایه ثابت (تومان)
                  </label>
                  <div className="relative">
                    <input
                      id="fixed-fare"
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      value={profile.fixedAmount > 0 ? String(profile.fixedAmount) : ''}
                      onChange={(e) => handleFixedAmountInput(e.target.value)}
                      placeholder="50000"
                      className={`min-h-[48px] w-full rounded-2xl border bg-slate-950/70 px-4 pl-16 text-left font-mono text-base font-bold text-white placeholder:text-slate-600 focus:outline-none tabular-nums ${
                        showErrors && errors.fixedAmount
                          ? 'border-rose-500'
                          : 'border-slate-700/80 focus:border-amber-400'
                      }`}
                    />
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-400">
                      تومان
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    {formatToman(profile.fixedAmount)} تومان ·{' '}
                    <span className="text-amber-300">
                      {numberToPersianWords(profile.fixedAmount)}
                    </span>
                  </p>
                  {showErrors && errors.fixedAmount && (
                    <p className="mt-1 text-xs text-rose-400">{errors.fixedAmount}</p>
                  )}
                </div>
              )}
            </div>

            {/* Optional Personal Payment Gateway Link */}
            <div>
              <label
                htmlFor="gateway-url"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300"
              >
                <Link2 className="h-3.5 w-3.5 text-slate-400" />
                <span>لینک درگاه پرداخت شخصی (اختیاری)</span>
              </label>
              <input
                id="gateway-url"
                type="url"
                dir="ltr"
                value={profile.gatewayUrl}
                onChange={(e) => onChange({ ...profile, gatewayUrl: e.target.value })}
                placeholder="https://payping.ir/d/username"
                className={`min-h-[48px] w-full rounded-2xl border bg-slate-950/70 px-4 text-left text-sm text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
                  showErrors && errors.gatewayUrl
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-slate-700/80 focus:border-emerald-400'
                }`}
              />
              {showErrors && errors.gatewayUrl ? (
                <p className="mt-1.5 text-xs text-rose-400">{errors.gatewayUrl}</p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">
                  در صورت داشتن درگاه پی‌پینگ، زیبال یا زرین‌پال، دکمه پرداخت آنلاین به مسافر نمایش داده می‌شود.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right/Left Column: Live 3D VIP Driver Card + Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="perspective-1000">
            <div
              onPointerMove={handleCardPointerMove}
              onPointerLeave={() => setCardTilt({ rx: 0, ry: 0 })}
              className="tilt-card-motion preserve-3d relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-[#152238] to-slate-950 p-6 shadow-2xl transition-transform duration-200 ease-out"
              style={{
                transform: `rotateX(${cardTilt.rx}deg) rotateY(${cardTilt.ry}deg)`,
              }}
            >
              {/* Subtle top sheen */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/12 to-transparent"
              />

              {/* Card Header */}
              <div className="relative z-10 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="text-lg font-extrabold text-emerald-400">کرایهچی</div>
                  <div
                    dir="rtl"
                    style={{ unicodeBidi: 'plaintext' }}
                    className="text-xs text-slate-400"
                  >
                    پرداخت سریع و امن کرایه با اسکن کد QR
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-amber-400">
                    {profile.fareMode === 'fixed'
                      ? `${formatToman(profile.fixedAmount)} تومان`
                      : 'مبلغ دلخواه'}
                  </div>
                  <div className="text-[11px] text-slate-400">{detectedBank.shortName}</div>
                </div>
              </div>

              {/* High-Contrast QR Frame */}
              <div className="relative z-10 my-5 flex flex-col items-center">
                <div
                  ref={qrWrapperRef}
                  data-testid="driver-qr-container"
                  className="relative flex h-52 w-52 items-center justify-center overflow-hidden rounded-3xl bg-white p-3.5 shadow-lg shadow-black/40"
                >
                  {isValid && shareUrl ? (
                    <QRCodeCanvas
                      value={shareUrl}
                      size={184}
                      level="M"
                      bgColor="#FFFFFF"
                      fgColor="#0F172A"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center px-3">
                      <span className="text-xs font-bold text-slate-700">
                        اطلاعات کارت یا خودرو ناقص است
                      </span>
                      <span className="mt-1 text-[11px] text-slate-500">
                        پس از تکمیل فرم، کد QR ساخته می‌شود
                      </span>
                    </div>
                  )}

                  {!subscription.isActive && (
                    <div
                      aria-label="حالت پیش‌نمایش و تست"
                      className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-12 bg-amber-400/95 py-1.5 text-center text-[11px] font-black text-slate-950 shadow-md"
                    >
                      حالت پیش‌نمایش / تست (Preview)
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs font-medium text-slate-300">
                  {subscription.isActive
                    ? 'دوربین گوشی را روی کد بالا بگیرید تا کرایه را بپردازید'
                    : 'پیش‌نمایش تست · برای خروجی نهایی اشتراک را فعال کنید'}
                </p>
              </div>

              {/* Driver & Plate Summary */}
              <div className="relative z-10 flex flex-col items-center gap-2.5 border-t border-slate-800/80 pt-4 text-center">
                <div>
                  <div className="text-base font-extrabold text-white">
                    {profile.name.trim() || 'نام راننده'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {profile.carModel.trim() || 'مدل خودرو'}
                  </div>
                </div>

                <IranianPlateBadge plate={profile.plate} size="sm" />

                <div
                  dir="ltr"
                  className="mt-1 font-mono text-xs font-semibold tracking-wider text-slate-300 tabular-nums"
                >
                  {formattedCardDisplay || '•••• - •••• - •••• - ••••'}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Export & Share Actions */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className={`min-h-[48px] flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold active:scale-[0.98] transition-all cursor-pointer ${
                subscription.isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                  : 'border border-slate-700 bg-slate-800/80 text-slate-300 hover:border-amber-400/50 hover:text-white'
              }`}
            >
              {subscription.isActive ? (
                <Download className="h-4.5 w-4.5 shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-amber-400 shrink-0" />
              )}
              <span>دانلود تصویر برچسب QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`min-h-[48px] flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold active:scale-[0.98] transition-all cursor-pointer ${
                subscription.isActive
                  ? 'border-slate-700 bg-slate-800/90 text-white hover:bg-slate-700'
                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-amber-400/50 hover:text-white'
              }`}
            >
              {subscription.isActive ? (
                <Copy className="h-4.5 w-4.5 text-amber-400 shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-amber-400 shrink-0" />
              )}
              <span>کپی لینک پرداخت</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowErrors(true);
              if (!isValid) {
                onShowToast('لطفاً ابتدا اطلاعات راننده را کامل کنید.', 'error');
                return;
              }
              onPreviewPassenger();
            }}
            className="min-h-[48px] w-full flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs sm:text-sm font-semibold text-amber-300 hover:bg-amber-400/20 transition-colors cursor-pointer"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span>پیش‌نمایش صفحه مسافر با همین مشخصات</span>
          </button>
        </div>
      </div>

      <DriverInstallBanner />
    </section>
  );
};
