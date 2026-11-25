import React, { useState } from 'react';
import { Download, PlusSquare, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallGuideModalProps {
  isIOS: boolean;
  onClose: () => void;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isIOS, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-guide-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 id="pwa-install-guide-title" className="text-base font-bold text-white">
            {isIOS ? 'نصب کرایهچی روی آیفون (iOS Safari)' : 'نصب اپلیکیشن کرایهچی روی گوشی'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="بستن راهنمای نصب"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          <ol className="space-y-3.5 text-sm text-slate-300 leading-relaxed">
            <li className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                ۱
              </span>
              <span>
                در نوار پایین مرورگر سافاری، آیکون اشتراک‌گذاری{' '}
                <strong className="text-white inline-flex items-center gap-1">
                  (مربع و فلش رو به بالا <Share className="w-4 h-4 text-sky-400 inline" />)
                </strong>{' '}
                را لمس کنید.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                ۲
              </span>
              <span>
                صفحه را به پایین اسکرول کرده و گزینه{' '}
                <strong className="text-white inline-flex items-center gap-1">
                  &ldquo;Add to Home Screen&rdquo; (افزودن به صفحه اصلی{' '}
                  <PlusSquare className="w-4 h-4 text-emerald-400 inline" />)
                </strong>{' '}
                را انتخاب کنید.
              </span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-3.5 text-sm text-slate-300 leading-relaxed">
            <li className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                ۱
              </span>
              <span>
                منوی مرورگر (سه نقطه بالا یا پایین صفحه) را باز کنید.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                ۲
              </span>
              <span>
                گزینه <strong className="text-white">Install App</strong> یا{' '}
                <strong className="text-white">Add to Home screen (افزودن به صفحه اصلی)</strong> را بزنید تا آیکون کرایهچی اضافه شود.
              </span>
            </li>
          </ol>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full min-h-[48px] rounded-2xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors cursor-pointer"
        >
          متوجه شدم
        </button>
      </div>
    </div>
  );
};

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="min-h-[40px] flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        aria-label="نصب اپلیکیشن کرایهچی"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>نصب اپ</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="min-h-[40px] flex items-center gap-1.5 rounded-xl bg-slate-800/80 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          aria-label="راهنمای نصب در آیفون"
        >
          <Download className="w-4 h-4 text-amber-400 shrink-0" />
          <span>نصب iOS</span>
        </button>

        {showGuide && <InstallGuideModal isIOS={true} onClose={() => setShowGuide(false)} />}
      </>
    );
  }

  return null;
};

const DISMISS_STORAGE_KEY = 'kerayehchi_install_banner_dismissed';

export const DriverInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(DISMISS_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors
    }
  };

  const handleInstallAction = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <aside
        aria-label="بنر نصب اپلیکیشن کرایهچی"
        className="mt-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-l from-slate-900/90 via-slate-900/80 to-emerald-950/40 p-4 sm:p-5 backdrop-blur-xl shadow-xl"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">
                دسترسی فوری و آفلاین روی صفحه اصلی گوشی
              </div>
              <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                کارت پرداخت شما بدون نیاز به اینترنت و با یک لمس از صفحه اصلی باز می‌شود.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallAction}
              className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>نصب اپلیکیشن کرایهچی روی گوشی</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="بستن پیشنهاد نصب اپلیکیشن"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {showGuide && <InstallGuideModal isIOS={isIOS} onClose={() => setShowGuide(false)} />}
    </>
  );
};
