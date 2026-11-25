import React from 'react';
import { QrCode, UserCheck } from 'lucide-react';
import type { AppMode } from '../types/driver';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderBarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ mode, onModeChange }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0F172A]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href={import.meta.env.BASE_URL}
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20">
            <QrCode className="h-4.5 w-4.5" />
          </span>
          <span>کرایهچی</span>
        </a>

        {/* Zone 2: Mode switcher */}
        <nav
          aria-label="تغییر حالت نمایش"
          className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1"
        >
          <button
            type="button"
            onClick={() => onModeChange('driver')}
            aria-pressed={mode === 'driver'}
            className={`min-h-[38px] flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'driver'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <QrCode className="h-4 w-4 shrink-0" />
            <span>پنل راننده</span>
          </button>
          <button
            type="button"
            onClick={() => onModeChange('passenger')}
            aria-pressed={mode === 'passenger'}
            className={`min-h-[38px] flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'passenger'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>نمای مسافر</span>
          </button>
        </nav>

        {/* Zone 3: PWA Install CTA */}
        <div className="flex items-center shrink-0">
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
