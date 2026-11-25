import React, { useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  Lock,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  DEFAULT_DEMO_DRIVER,
  type DriverProfile,
  type SubscriptionPlan,
} from '../types/driver';
import {
  DEFAULT_ADMIN_PIN,
  encodeTransferCode,
  generateActivationCode,
  getPlanLabel,
  normalizeActivationCode,
  type CustomCodeEntry,
} from '../utils/subscription';
import { detectIranianBank, formatCardGroups } from '../utils/iranBanks';
import { onlyDigits, toEnglishDigits } from '../utils/persianNumbers';
import { validateDriverProfile } from '../utils/driverValidation';
import { buildPassengerShareUrl } from '../utils/urlCodec';
import { exportDriverQrStickerPng } from '../utils/qrStickerExport';
import { triggerHaptic } from '../utils/audioChime';
import { IranianPlateInput } from './IranianPlateBadge';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDriverProfile: DriverProfile;
  customCodes: CustomCodeEntry[];
  onAddCustomCode: (entry: CustomCodeEntry) => void;
  onRemoveCustomCode: (code: string) => void;
  onApplyProfileAndActivate: (profile: DriverProfile, code: string, planLabel: string) => void;
  onShowToast: (message: string, tone?: 'success' | 'error') => void;
}

interface GeneratedCodeRecord {
  code: string;
  planLabel: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentDriverProfile,
  customCodes,
  onAddCustomCode,
  onRemoveCustomCode,
  onApplyProfileAndActivate,
  onShowToast,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<'codes' | 'builder'>('codes');

  // Code Generator state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('1m');
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCodeRecord[]>([]);
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [customLabelInput, setCustomLabelInput] = useState('اشتراک اختصاصی');

  // Assisted Driver Profile Builder state
  const [builderProfile, setBuilderProfile] = useState<DriverProfile>(currentDriverProfile);
  const [builderPlan, setBuilderPlan] = useState<SubscriptionPlan>('1m');
  const [builderCode, setBuilderCode] = useState<string>(() => generateActivationCode('1m'));
  const [showBuilderErrors, setShowBuilderErrors] = useState(false);
  const adminQrRef = useRef<HTMLDivElement | null>(null);

  const builderErrors = useMemo(() => validateDriverProfile(builderProfile), [builderProfile]);
  const isBuilderValid = Object.keys(builderErrors).length === 0;
  const builderBank = useMemo(
    () => detectIranianBank(builderProfile.cardNumber),
    [builderProfile.cardNumber]
  );

  const builderShareUrl = useMemo(() => {
    if (!isBuilderValid || typeof window === 'undefined') return '';
    return buildPassengerShareUrl(builderProfile, window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, ''));
  }, [isBuilderValid, builderProfile]);

  const transferCode = useMemo(() => {
    if (!isBuilderValid) return '';
    return encodeTransferCode(builderProfile, builderCode);
  }, [isBuilderValid, builderProfile, builderCode]);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPin = toEnglishDigits(pinInput).trim();
    if (normalizedPin !== DEFAULT_ADMIN_PIN) {
      setPinError('رمز ورود ادمین نادرست است.');
      return;
    }
    setPinError('');
    setPinInput('');
    setIsUnlocked(true);
    triggerHaptic(25);
  };

  const handleGenerateCode = () => {
    const newCode = generateActivationCode(selectedPlan);
    const planLabel = getPlanLabel(selectedPlan);
    setGeneratedCodes((prev) => [{ code: newCode, planLabel }, ...prev].slice(0, 8));
    triggerHaptic(20);
    onShowToast(`کد ${planLabel} تولید شد.`);
  };

  const handleCopyText = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerHaptic(20);
      onShowToast(msg);
    } catch {
      onShowToast('کپی خودکار انجام نشد؛ متن را دستی کپی کنید.', 'error');
    }
  };

  const handleAddCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const norm = normalizeActivationCode(customCodeInput);
    if (norm.length < 4) {
      onShowToast('کد سفارشی باید حداقل ۴ کاراکتر باشد.', 'error');
      return;
    }
    onAddCustomCode({
      code: norm,
      planLabel: customLabelInput.trim() || 'اشتراک اختصاصی',
    });
    setCustomCodeInput('');
    onShowToast(`کد سفارشی ${norm} ذخیره شد.`);
  };

  const handleBuilderDownloadPng = async () => {
    setShowBuilderErrors(true);
    if (!isBuilderValid) {
      onShowToast('ابتدا اطلاعات راننده را کامل و بدون خطا پر کنید.', 'error');
      return;
    }
    const canvas = adminQrRef.current?.querySelector('canvas') ?? null;
    const ok = await exportDriverQrStickerPng(builderProfile, canvas);
    if (ok) {
      triggerHaptic(30);
      onShowToast('برچسب QR آماده چاپ برای راننده دانلود شد.');
    } else {
      onShowToast('خطا در تولید تصویر برچسب.', 'error');
    }
  };

  const handleApplyToThisDevice = () => {
    setShowBuilderErrors(true);
    if (!isBuilderValid) {
      onShowToast('اطلاعات راننده کامل نیست.', 'error');
      return;
    }
    onApplyProfileAndActivate(builderProfile, builderCode, getPlanLabel(builderPlan));
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-3 sm:p-5 backdrop-blur-md"
    >
      <div className="my-auto w-full max-w-3xl rounded-3xl border border-slate-700/80 bg-[#0F172A] shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              {isUnlocked ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </span>
            <div>
              <h2 id="admin-modal-title" className="text-base font-extrabold text-white">
                {isUnlocked ? 'پنل مدیریت و ساخت برای راننده' : 'ورود ادمین کرایهچی'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isUnlocked
                  ? 'تولید کد اشتراک، ساخت برچسب QR کمکی و کد انتقال سریع'
                  : 'برای دسترسی به ابزارهای مدیریت، پین امنیتی را وارد کنید'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره ادمین"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {!isUnlocked ? (
          <form onSubmit={handlePinSubmit} className="p-6 max-w-sm mx-auto space-y-4 text-center">
            <div>
              <label
                htmlFor="admin-pin-input"
                className="mb-2 block text-xs font-semibold text-slate-300"
              >
                پین کد ادمین
              </label>
              <input
                id="admin-pin-input"
                type="password"
                inputMode="numeric"
                dir="ltr"
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinError('');
                  setPinInput(e.target.value);
                }}
                placeholder="••••"
                className="min-h-[52px] w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 text-center font-mono text-2xl font-bold tracking-[0.4em] text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
              />
              {pinError && <p className="mt-2 text-xs font-semibold text-rose-400">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="min-h-[48px] w-full rounded-2xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-300 active:scale-[0.98] transition-all cursor-pointer"
            >
              ورود به پنل ادمین
            </button>
          </form>
        ) : (
          <div className="p-5 sm:p-6 space-y-5 max-h-[82dvh] overflow-y-auto">
            {/* Admin Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('codes')}
                className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'codes'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <KeyRound className="h-4 w-4 shrink-0" />
                <span>تولید کد اشتراک</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('builder')}
                className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl px-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'builder'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                <span>ساخت پروفایل کمکی راننده</span>
              </button>
            </div>

            {activeTab === 'codes' ? (
              <div className="space-y-6">
                {/* 1. Instant Subscription Code Generator */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        تولید آنی کد فعالسازی اشتراک
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        کدهای ساخته‌شده دارای رقم کنترلی معتبر هستند و بدون نیاز به اینترنت روی گوشی راننده کار می‌کنند.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['1m', '3m', '1y'] as const).map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className={`min-h-[44px] rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          selectedPlan === plan
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {getPlanLabel(plan)}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="min-h-[48px] w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>تولید کد فعالسازی ({getPlanLabel(selectedPlan)})</span>
                  </button>

                  {generatedCodes.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {generatedCodes.map((item) => (
                        <div
                          key={item.code}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/25 bg-slate-950/70 px-3.5 py-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <span dir="ltr" className="font-mono text-sm font-extrabold text-emerald-300">
                              {item.code}
                            </span>
                            <span className="text-xs text-slate-400">· {item.planLabel}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(item.code, `کد ${item.code} کپی شد.`)
                              }
                              className="min-h-[36px] inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5 text-emerald-400" />
                              <span>کپی کد</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onApplyProfileAndActivate(
                                  currentDriverProfile,
                                  item.code,
                                  item.planLabel
                                );
                                onClose();
                              }}
                              className="min-h-[36px] inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>فعالسازی</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Configurable Custom Codes in localStorage */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-3">
                  <h3 className="text-sm font-extrabold text-white">
                    لیست کدهای سفارشی ذخیره‌شده در این دستگاه
                  </h3>
                  <form onSubmit={handleAddCustomSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                    <input
                      type="text"
                      dir="ltr"
                      value={customCodeInput}
                      onChange={(e) => setCustomCodeInput(e.target.value)}
                      placeholder="VIP-TAXI-1405"
                      aria-label="کد سفارشی جدید"
                      className="sm:col-span-5 min-h-[44px] rounded-xl border border-slate-700 bg-slate-950/80 px-3 font-mono text-xs font-bold uppercase text-white placeholder:text-slate-600 focus:border-emerald-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={customLabelInput}
                      onChange={(e) => setCustomLabelInput(e.target.value)}
                      placeholder="عنوان اشتراک"
                      aria-label="عنوان کد سفارشی"
                      className="sm:col-span-4 min-h-[44px] rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-xs text-white placeholder:text-slate-600 focus:border-emerald-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="sm:col-span-3 min-h-[44px] inline-flex items-center justify-center gap-1 rounded-xl bg-slate-800 border border-slate-700 px-3 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer"
                    >
                      <Plus className="h-4 w-4 text-emerald-400" />
                      <span>افزودن کد</span>
                    </button>
                  </form>

                  {customCodes.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {customCodes.map((c) => (
                        <div
                          key={c.code}
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs"
                        >
                          <div>
                            <span dir="ltr" className="font-mono font-bold text-amber-300">
                              {c.code}
                            </span>
                            <span className="mx-2 text-slate-500">·</span>
                            <span className="text-slate-300">{c.planLabel}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveCustomCode(c.code)}
                            aria-label={`حذف کد ${c.code}`}
                            className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Assisted Driver Profile Builder */
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-300">
                    مشخصات راننده را ثبت کنید تا کد اشتراک، برچسب PNG، لینک مسافر و کد انتقال آماده ارسال شود.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBuilderErrors(false);
                        setBuilderProfile(currentDriverProfile);
                      }}
                      className="min-h-[36px] rounded-xl border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
                    >
                      از فرم فعلی
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBuilderErrors(false);
                        setBuilderProfile({
                          ...DEFAULT_DEMO_DRIVER,
                          name: '',
                          carModel: '',
                          cardNumber: '',
                          plate: { left2: '', letter: 'ت', right3: '', iranCode: '' },
                        });
                      }}
                      className="min-h-[36px] rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                    >
                      فرم جدید خالی
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="admin-driver-name" className="mb-1 block text-xs font-semibold text-slate-300">
                      نام و نام خانوادگی راننده
                    </label>
                    <input
                      id="admin-driver-name"
                      type="text"
                      value={builderProfile.name}
                      onChange={(e) =>
                        setBuilderProfile({ ...builderProfile, name: e.target.value })
                      }
                      placeholder="نام راننده"
                      className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                    {showBuilderErrors && builderErrors.name && (
                      <p className="mt-1 text-[11px] text-rose-400">{builderErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="admin-car-model" className="mb-1 block text-xs font-semibold text-slate-300">
                      مدل و رنگ خودرو
                    </label>
                    <input
                      id="admin-car-model"
                      type="text"
                      value={builderProfile.carModel}
                      onChange={(e) =>
                        setBuilderProfile({ ...builderProfile, carModel: e.target.value })
                      }
                      placeholder="پژو ۴۰۵ نوک‌مدادی"
                      className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                    {showBuilderErrors && builderErrors.carModel && (
                      <p className="mt-1 text-[11px] text-rose-400">{builderErrors.carModel}</p>
                    )}
                  </div>
                </div>

                <div>
                  <span className="mb-1 block text-xs font-semibold text-slate-300">پلاک خودرو</span>
                  <IranianPlateInput
                    plate={builderProfile.plate}
                    onChange={(plate) => setBuilderProfile({ ...builderProfile, plate })}
                    hasError={Boolean(showBuilderErrors && builderErrors.plate)}
                  />
                  {showBuilderErrors && builderErrors.plate && (
                    <p className="mt-1 text-[11px] text-rose-400">{builderErrors.plate}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <label htmlFor="admin-card-number" className="font-semibold text-slate-300">
                        شماره کارت ۱۶ رقمی
                      </label>
                      <span style={{ color: builderBank.accentColor }}>
                        {builderProfile.cardNumber.length >= 6 ? builderBank.shortName : 'شتاب'}
                      </span>
                    </div>
                    <input
                      id="admin-card-number"
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      value={formatCardGroups(builderProfile.cardNumber, false)}
                      onChange={(e) =>
                        setBuilderProfile({
                          ...builderProfile,
                          cardNumber: onlyDigits(e.target.value, 16),
                        })
                      }
                      placeholder="6037 - 9971 - 0000 - 0000"
                      className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-center font-mono text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
                    />
                    {showBuilderErrors && builderErrors.cardNumber && (
                      <p className="mt-1 text-[11px] text-rose-400">{builderErrors.cardNumber}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="admin-gateway-url" className="mb-1 block text-xs font-semibold text-slate-300">
                      لینک درگاه شخصی (اختیاری)
                    </label>
                    <input
                      id="admin-gateway-url"
                      type="url"
                      dir="ltr"
                      value={builderProfile.gatewayUrl}
                      onChange={(e) =>
                        setBuilderProfile({ ...builderProfile, gatewayUrl: e.target.value })
                      }
                      placeholder="https://payping.ir/d/..."
                      className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-left text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Fare Mode + Assigned Subscription Code */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-300">نوع کرایه</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setBuilderProfile({ ...builderProfile, fareMode: 'variable' })
                        }
                        className={`min-h-[38px] rounded-xl text-xs font-bold cursor-pointer ${
                          builderProfile.fareMode === 'variable'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        دلخواه
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setBuilderProfile({ ...builderProfile, fareMode: 'fixed' })
                        }
                        className={`min-h-[38px] rounded-xl text-xs font-bold cursor-pointer ${
                          builderProfile.fareMode === 'fixed'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        ثابت
                      </button>
                    </div>
                    {builderProfile.fareMode === 'fixed' && (
                      <input
                        type="text"
                        inputMode="numeric"
                        dir="ltr"
                        aria-label="مبلغ ثابت ادمین"
                        value={builderProfile.fixedAmount > 0 ? String(builderProfile.fixedAmount) : ''}
                        onChange={(e) =>
                          setBuilderProfile({
                            ...builderProfile,
                            fixedAmount: parseInt(onlyDigits(e.target.value, 9) || '0', 10),
                          })
                        }
                        placeholder="50000"
                        className="mt-2 min-h-[38px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-center font-mono text-xs font-bold text-white"
                      />
                    )}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">کد اشتراک اختصاص‌یافته</span>
                      <button
                        type="button"
                        onClick={() => setBuilderCode(generateActivationCode(builderPlan))}
                        className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                      >
                        کد جدید
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <select
                        aria-label="مدت اشتراک ادمین"
                        value={builderPlan}
                        onChange={(e) => {
                          const p = e.target.value as SubscriptionPlan;
                          setBuilderPlan(p);
                          setBuilderCode(generateActivationCode(p));
                        }}
                        className="min-h-[38px] rounded-xl border border-slate-700 bg-slate-950 px-2 text-xs font-bold text-white"
                      >
                        <option value="1m">۱ ماهه</option>
                        <option value="3m">۳ ماهه</option>
                        <option value="1y">۱ ساله</option>
                      </select>
                      <input
                        type="text"
                        dir="ltr"
                        readOnly
                        aria-label="کد اشتراک اختصاص‌یافته"
                        value={builderCode}
                        className="min-h-[38px] flex-1 rounded-xl border border-emerald-500/35 bg-slate-950 px-2 text-center font-mono text-xs font-bold text-emerald-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Offscreen QR Canvas for Admin PNG Sticker Download */}
                <div ref={adminQrRef} className="sr-only" aria-hidden="true">
                  {isBuilderValid && builderShareUrl && (
                    <QRCodeCanvas
                      value={builderShareUrl}
                      size={220}
                      level="M"
                      bgColor="#FFFFFF"
                      fgColor="#0F172A"
                    />
                  )}
                </div>

                {/* Quick Transfer Code Preview */}
                <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-sky-300">
                      کد انتقال پروفایل + اشتراک (ارسال به راننده)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBuilderErrors(true);
                        if (!transferCode) {
                          onShowToast('ابتدا فرم راننده را کامل کنید.', 'error');
                          return;
                        }
                        handleCopyText(
                          transferCode,
                          'کد انتقال پروفایل کپی شد؛ برای راننده ارسال کنید.'
                        );
                      }}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-1 text-xs font-extrabold text-slate-950 hover:bg-sky-400 cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>کپی کد انتقال</span>
                    </button>
                  </div>
                  <div
                    dir="ltr"
                    className="truncate rounded-xl bg-slate-950/80 px-3 py-2 font-mono text-[11px] text-slate-300"
                  >
                    {transferCode || 'ابتدا مشخصات راننده را کامل کنید...'}
                  </div>
                </div>

                {/* Admin Export & Apply Actions */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={handleBuilderDownloadPng}
                    className="min-h-[46px] flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 px-3 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span>دانلود برچسب QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowBuilderErrors(true);
                      if (!builderShareUrl) {
                        onShowToast('اطلاعات راننده ناقص است.', 'error');
                        return;
                      }
                      handleCopyText(builderShareUrl, 'لینک مستقیم مسافر کپی شد.');
                    }}
                    className="min-h-[46px] flex items-center justify-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer"
                  >
                    <Copy className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>کپی لینک مسافر</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyToThisDevice}
                    className="min-h-[46px] flex items-center justify-center gap-1.5 rounded-2xl border border-amber-400/40 bg-amber-400/15 px-3 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-400/25 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>اعمال روی این دستگاه</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
