import React, { useState } from 'react';
import {
  CheckCircle2,
  DownloadCloud,
  KeyRound,
  Lock,
  MessageCircle,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import type { SubscriptionState } from '../types/driver';
import { ADMIN_SUPPORT_CONTACT } from '../utils/subscription';

interface SubscriptionCardProps {
  subscription: SubscriptionState;
  onActivateCode: (code: string) => { ok: boolean; message: string };
  onImportTransferCode: (transferStr: string) => { ok: boolean; message: string };
  onDeactivate: () => void;
  activationInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onActivateCode,
  onImportTransferCode,
  onDeactivate,
  activationInputRef,
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [showTransferBox, setShowTransferBox] = useState(false);
  const [transferInput, setTransferInput] = useState('');
  const [transferError, setTransferError] = useState('');

  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onActivateCode(codeInput);
    if (!res.ok) {
      setCodeError(res.message);
      return;
    }
    setCodeError('');
    setCodeInput('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onImportTransferCode(transferInput);
    if (!res.ok) {
      setTransferError(res.message);
      return;
    }
    setTransferError('');
    setTransferInput('');
    setShowTransferBox(false);
  };

  return (
    <div
      aria-label="وضعیت اشتراک و فعالسازی"
      className={`mb-6 rounded-3xl border p-4 sm:p-5 backdrop-blur-xl shadow-xl transition-colors ${
        subscription.isActive
          ? 'border-emerald-500/35 bg-emerald-950/25'
          : 'border-amber-500/35 bg-slate-900/75'
      }`}
    >
      {subscription.isActive ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-emerald-300">
                <span>اشتراک فعال</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-white">{subscription.planLabel}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span>تمامی امکانات دانلود برچسب QR و کپی لینک فعال است</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span dir="ltr" className="font-mono font-bold text-emerald-300">
                  {subscription.code}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowTransferBox((prev) => !prev)}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <DownloadCloud className="h-3.5 w-3.5 text-sky-400" />
              <span>وارد کردن کد انتقال پروفایل</span>
            </button>
            <button
              type="button"
              onClick={onDeactivate}
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Unlock className="h-3.5 w-3.5 text-amber-400" />
              <span>خروج از اشتراک</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-amber-300">
                  <span>نیاز به فعالسازی اشتراک</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-200">حالت پیش‌نمایش / تست</span>
                </div>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  در این حالت می‌توانید کارت را تست کنید؛ برای دانلود برچسب چاپی QR و کپی لینک اختصاصی، کد فعالسازی را وارد کنید.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleActivateSubmit}
              className="flex flex-col gap-2 sm:flex-row sm:items-center shrink-0"
            >
              <div className="relative">
                <KeyRound className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  ref={activationInputRef}
                  id="activation-code-input"
                  type="text"
                  dir="ltr"
                  aria-label="کد فعالسازی اشتراک"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeError('');
                    setCodeInput(e.target.value);
                  }}
                  placeholder="KC-1MXX-XXXX"
                  className={`min-h-[48px] w-full sm:w-52 rounded-2xl border bg-slate-950/80 pr-10 pl-3 text-center font-mono text-sm font-bold uppercase tracking-wider text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
                    codeError
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-700 focus:border-emerald-400'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>فعالسازی</span>
              </button>
            </form>
          </div>

          {codeError && <p className="text-xs font-semibold text-rose-400">{codeError}</p>}

          <div className="flex flex-col gap-2.5 border-t border-slate-800/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                دریافت کد اشتراک از ادمین: تلگرام{' '}
                <strong dir="ltr" className="text-slate-200 font-mono">
                  {ADMIN_SUPPORT_CONTACT.telegram}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowTransferBox((prev) => !prev)}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-sky-200 transition-colors cursor-pointer"
            >
              <DownloadCloud className="h-4 w-4 shrink-0" />
              <span>
                {showTransferBox ? 'بستن بخش انتقال پروفایل' : 'کد انتقال پروفایل از ادمین دارید؟'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Profile Transfer Importer */}
      {showTransferBox && (
        <form
          onSubmit={handleTransferSubmit}
          className="mt-4 border-t border-slate-800 pt-4 space-y-2.5"
        >
          <label
            htmlFor="transfer-code-input"
            className="block text-xs font-semibold text-slate-200"
          >
            کد انتقال پروفایل (KCT1:...) دریافتی از ادمین را اینجا جایگذاری کنید:
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="transfer-code-input"
              type="text"
              dir="ltr"
              value={transferInput}
              onChange={(e) => {
                setTransferError('');
                setTransferInput(e.target.value);
              }}
              placeholder="KCT1:eyJ2Ijox..."
              className="min-h-[46px] flex-1 rounded-2xl border border-slate-700 bg-slate-950/80 px-3.5 text-left font-mono text-xs text-white placeholder:text-slate-600 focus:border-sky-400 focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[46px] inline-flex items-center justify-center gap-1.5 rounded-2xl bg-sky-500 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 hover:bg-sky-400 transition-colors whitespace-nowrap cursor-pointer"
            >
              <DownloadCloud className="h-4 w-4 shrink-0" />
              <span>اعمال کد انتقال</span>
            </button>
          </div>
          {transferError && <p className="text-xs text-rose-400">{transferError}</p>}
        </form>
      )}
    </div>
  );
};
