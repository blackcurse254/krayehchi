import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_DEMO_DRIVER,
  type AppMode,
  type DriverProfile,
  type SubscriptionState,
} from './types/driver';
import { decodeDriverProfile } from './utils/urlCodec';
import {
  decodeTransferCode,
  INITIAL_INACTIVE_SUBSCRIPTION,
  validateActivationCode,
  type CustomCodeEntry,
} from './utils/subscription';
import { triggerHaptic } from './utils/audioChime';
import { HeaderBar } from './components/HeaderBar';
import { DriverPanel } from './components/DriverPanel';
import { PassengerPanel } from './components/PassengerPanel';
import { ReceiptModal } from './components/ReceiptModal';
import { AdminModal } from './components/AdminModal';
import { Toast, type ToastState } from './components/Toast';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEY = 'kerayehchi_driver_profile_v1';
const SUBSCRIPTION_STORAGE_KEY = 'kerayehchi_subscription_v1';
const CUSTOM_CODES_STORAGE_KEY = 'kerayehchi_custom_codes_v1';

function loadSavedDriverProfile(): DriverProfile {
  if (typeof window === 'undefined') return DEFAULT_DEMO_DRIVER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DEMO_DRIVER;
    const parsed = JSON.parse(raw) as Partial<DriverProfile>;
    if (
      typeof parsed.name === 'string' &&
      typeof parsed.carModel === 'string' &&
      parsed.plate &&
      typeof parsed.cardNumber === 'string'
    ) {
      return {
        name: parsed.name,
        carModel: parsed.carModel,
        plate: {
          left2: String(parsed.plate.left2 ?? ''),
          letter: String(parsed.plate.letter ?? 'ت'),
          right3: String(parsed.plate.right3 ?? ''),
          iranCode: String(parsed.plate.iranCode ?? ''),
        },
        cardNumber: parsed.cardNumber,
        fareMode: parsed.fareMode === 'fixed' ? 'fixed' : 'variable',
        fixedAmount:
          typeof parsed.fixedAmount === 'number' && Number.isFinite(parsed.fixedAmount)
            ? parsed.fixedAmount
            : 50000,
        gatewayUrl: typeof parsed.gatewayUrl === 'string' ? parsed.gatewayUrl : '',
      };
    }
  } catch {
    // Ignore corrupted storage
  }
  return DEFAULT_DEMO_DRIVER;
}

function loadSavedSubscription(): SubscriptionState {
  if (typeof window === 'undefined') return INITIAL_INACTIVE_SUBSCRIPTION;
  try {
    const raw = window.localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) return INITIAL_INACTIVE_SUBSCRIPTION;
    const parsed = JSON.parse(raw) as Partial<SubscriptionState>;
    if (parsed && typeof parsed.isActive === 'boolean' && typeof parsed.code === 'string') {
      return {
        isActive: parsed.isActive,
        code: parsed.code,
        planLabel: typeof parsed.planLabel === 'string' ? parsed.planLabel : 'اشتراک فعال',
        activatedAt: typeof parsed.activatedAt === 'string' ? parsed.activatedAt : '',
      };
    }
  } catch {
    // Ignore corrupted storage
  }
  return INITIAL_INACTIVE_SUBSCRIPTION;
}

function loadCustomCodes(): CustomCodeEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_CODES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is CustomCodeEntry =>
          item && typeof item.code === 'string' && typeof item.planLabel === 'string'
      );
    }
  } catch {
    // Ignore corrupted storage
  }
  return [];
}

function parseInitialUrlState(): {
  hasUrlParam: boolean;
  decodedProfile: DriverProfile | null;
} {
  if (typeof window === 'undefined') {
    return { hasUrlParam: false, decodedProfile: null };
  }
  const params = new URLSearchParams(window.location.search);
  const dParam = params.get('d');
  if (!dParam) {
    return { hasUrlParam: false, decodedProfile: null };
  }
  return {
    hasUrlParam: true,
    decodedProfile: decodeDriverProfile(dParam),
  };
}

export default function App() {
  const [initialUrl] = useState(parseInitialUrlState);
  const [mode, setMode] = useState<AppMode>(() =>
    initialUrl.hasUrlParam ? 'passenger' : 'driver'
  );
  const [passengerSource, setPassengerSource] = useState<'url' | 'local'>(() =>
    initialUrl.hasUrlParam ? 'url' : 'local'
  );
  const [driverProfile, setDriverProfile] = useState<DriverProfile>(loadSavedDriverProfile);
  const [subscription, setSubscription] = useState<SubscriptionState>(loadSavedSubscription);
  const [customCodes, setCustomCodes] = useState<CustomCodeEntry[]>(loadCustomCodes);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [receiptAmount, setReceiptAmount] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(driverProfile));
    } catch {
      // Ignore storage quota issues
    }
  }, [driverProfile]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
    } catch {
      // Ignore storage quota issues
    }
  }, [subscription]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CUSTOM_CODES_STORAGE_KEY, JSON.stringify(customCodes));
    } catch {
      // Ignore storage quota issues
    }
  }, [customCodes]);

  const showToast = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ message, tone });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const handleActivateCode = useCallback(
    (rawCode: string): { ok: boolean; message: string } => {
      const check = validateActivationCode(rawCode, customCodes);
      if (!check.valid) {
        const msg = 'کد فعالسازی واردشده معتبر نیست.';
        showToast(msg, 'error');
        return { ok: false, message: msg };
      }

      setSubscription({
        isActive: true,
        code: check.normalizedCode,
        planLabel: check.planLabel,
        activatedAt: new Date().toISOString(),
      });
      triggerHaptic([25, 40, 35]);
      showToast(`${check.planLabel} با موفقیت فعال شد.`);
      return { ok: true, message: '' };
    },
    [customCodes, showToast]
  );

  const handleImportTransferCode = useCallback(
    (rawTransfer: string): { ok: boolean; message: string } => {
      const bundle = decodeTransferCode(rawTransfer, customCodes);
      if (!bundle) {
        const msg = 'کد انتقال پروفایل معتبر نیست.';
        showToast(msg, 'error');
        return { ok: false, message: msg };
      }

      setDriverProfile(bundle.profile);
      if (bundle.activationCode) {
        const check = validateActivationCode(bundle.activationCode, customCodes);
        if (check.valid) {
          setSubscription({
            isActive: true,
            code: check.normalizedCode,
            planLabel: check.planLabel,
            activatedAt: new Date().toISOString(),
          });
        }
      }
      triggerHaptic([25, 40, 40]);
      showToast(
        bundle.activationCode
          ? 'پروفایل راننده و اشتراک با موفقیت وارد و فعال شد.'
          : 'پروفایل راننده با موفقیت جایگذاری شد.'
      );
      return { ok: true, message: '' };
    },
    [customCodes, showToast]
  );

  const handleDeactivateSubscription = useCallback(() => {
    setSubscription(INITIAL_INACTIVE_SUBSCRIPTION);
    showToast('اشتراک روی این دستگاه غیرفعال شد.');
  }, [showToast]);

  const handleAddCustomCode = useCallback((entry: CustomCodeEntry) => {
    setCustomCodes((prev) => {
      const filtered = prev.filter((c) => c.code !== entry.code);
      return [entry, ...filtered];
    });
  }, []);

  const handleRemoveCustomCode = useCallback((code: string) => {
    setCustomCodes((prev) => prev.filter((c) => c.code !== code));
    showToast(`کد ${code} حذف شد.`);
  }, [showToast]);

  const handleApplyFromAdmin = useCallback(
    (profile: DriverProfile, code: string, planLabel: string) => {
      setDriverProfile(profile);
      setSubscription({
        isActive: true,
        code,
        planLabel,
        activatedAt: new Date().toISOString(),
      });
      triggerHaptic([30, 40, 50]);
      showToast('پروفایل جدید راننده اعمال و اشتراک فعال شد.');
    },
    [showToast]
  );

  const handleModeChange = (nextMode: AppMode) => {
    setMode(nextMode);
    if (nextMode === 'passenger' && !initialUrl.hasUrlParam) {
      setPassengerSource('local');
    }
  };

  const handlePreviewPassengerFromDriver = () => {
    setPassengerSource('local');
    setMode('passenger');
  };

  const activePassengerProfile =
    passengerSource === 'url' ? initialUrl.decodedProfile : driverProfile;
  const isInvalidUrlParam =
    passengerSource === 'url' && initialUrl.hasUrlParam && initialUrl.decodedProfile === null;

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <HeaderBar mode={mode} onModeChange={handleModeChange} />

      <main className="flex-1">
        {mode === 'driver' ? (
          <DriverPanel
            profile={driverProfile}
            subscription={subscription}
            onChange={setDriverProfile}
            onActivateCode={handleActivateCode}
            onImportTransferCode={handleImportTransferCode}
            onDeactivateSubscription={handleDeactivateSubscription}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onShowToast={showToast}
            onPreviewPassenger={handlePreviewPassengerFromDriver}
          />
        ) : (
          <PassengerPanel
            profile={activePassengerProfile}
            isInvalidUrlParam={isInvalidUrlParam}
            onShowToast={showToast}
            onSwitchToDriver={() => setMode('driver')}
            onOpenReceipt={(amount) => setReceiptAmount(amount)}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/70 py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4">
          کرایهچی · پرداخت مستقیم و بدون واسطه کرایه تاکسی
        </div>
      </footer>

      {receiptAmount !== null && activePassengerProfile && (
        <ReceiptModal
          profile={activePassengerProfile}
          paidAmount={receiptAmount}
          onClose={() => setReceiptAmount(null)}
        />
      )}

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        currentDriverProfile={driverProfile}
        customCodes={customCodes}
        onAddCustomCode={handleAddCustomCode}
        onRemoveCustomCode={handleRemoveCustomCode}
        onApplyProfileAndActivate={handleApplyFromAdmin}
        onShowToast={showToast}
      />

      <Toast toast={toast} />
      <OfflineIndicator />
    </div>
  );
}
