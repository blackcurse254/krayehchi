import React, { useEffect, useMemo } from 'react';
import { Check, Volume2, X } from 'lucide-react';
import type { DriverProfile } from '../types/driver';
import { formatJalaliDateTime, formatToman, numberToPersianWords } from '../utils/persianNumbers';
import { playPaymentSuccessChime, triggerHaptic } from '../utils/audioChime';
import { IranianPlateBadge } from './IranianPlateBadge';

interface ReceiptModalProps {
  profile: DriverProfile;
  paidAmount: number;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  profile,
  paidAmount,
  onClose,
}) => {
  const timestamp = useMemo(() => formatJalaliDateTime(new Date()), []);

  useEffect(() => {
    playPaymentSuccessChime();
    triggerHaptic([35, 45, 70]);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-y-auto bg-gradient-to-b from-emerald-600 via-emerald-700 to-emerald-950 px-5 py-6 text-white"
    >
      {/* Top Close & Replay Sound Bar */}
      <div className="flex w-full max-w-md items-center justify-between">
        <button
          type="button"
          onClick={() => playPaymentSuccessChime()}
          className="min-h-[44px] inline-flex items-center gap-1.5 rounded-2xl bg-white/15 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md hover:bg-white/25 transition-colors cursor-pointer"
          aria-label="پخش مجدد صدای تایید"
        >
          <Volume2 className="h-4 w-4" />
          <span>پخش صدا</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-md hover:bg-white/25 transition-colors cursor-pointer"
          aria-label="بستن صفحه تاییدیه"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Center High-Visibility Confirmation Badge */}
      <div className="my-auto flex w-full max-w-md flex-col items-center py-6 text-center">
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-white/20 animate-ping"
            style={{ animationDuration: '2.2s' }}
          />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white text-emerald-700 shadow-2xl">
            <Check className="h-14 w-14 stroke-[3.2]" />
          </div>
        </div>

        <h2 id="receipt-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          پرداخت توسط مسافر اعلام شد
        </h2>

        {/* Paid Amount Card */}
        <div className="mt-6 w-full rounded-3xl border border-white/25 bg-slate-950/30 p-6 backdrop-blur-xl shadow-2xl">
          <div className="text-xs font-semibold text-emerald-100/85">مبلغ اعلام‌شده توسط مسافر</div>
          <div className="mt-2 text-4xl sm:text-5xl font-extrabold text-white tabular-nums">
            {formatToman(paidAmount)}{' '}
            <span className="text-lg font-bold text-emerald-200">تومان</span>
          </div>
          <div className="mt-2 text-sm font-semibold text-amber-300">
            {numberToPersianWords(paidAmount)}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-xs">
            <div className="text-right">
              <div className="text-emerald-100/70">تاریخ</div>
              <div className="mt-0.5 font-bold text-white">{timestamp.dateText}</div>
            </div>
            <div className="text-left">
              <div className="text-emerald-100/70">ساعت</div>
              <div className="mt-0.5 font-bold text-white tabular-nums">{timestamp.timeText}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 w-full rounded-2xl border border-amber-300/40 bg-amber-400/15 px-4 py-3 text-center text-xs font-bold leading-relaxed text-amber-100">
          این صفحه تأیید بانکی نیست. راننده لطفاً پیامک بانک را بررسی کند.
        </div>

        {/* Driver Summary for Visual Verification */}
        <div className="mt-5 flex flex-col items-center gap-2.5">
          <div className="text-sm font-bold text-emerald-50">
            راننده: {profile.name} · {profile.carModel}
          </div>
          <IranianPlateBadge plate={profile.plate} size="sm" />
        </div>
      </div>

      {/* Bottom Dismiss Button */}
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[54px] w-full rounded-2xl bg-white px-6 py-3.5 text-base font-extrabold text-emerald-900 shadow-xl hover:bg-emerald-50 active:scale-[0.98] transition-all cursor-pointer"
        >
          بستن رسید
        </button>
      </div>
    </div>
  );
};
