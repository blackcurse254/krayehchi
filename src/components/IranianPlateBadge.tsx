import React from 'react';
import { PERSIAN_PLATE_LETTERS, type LicensePlate } from '../types/driver';
import { onlyDigits, toPersianDigits } from '../utils/persianNumbers';

interface IranianPlateBadgeProps {
  plate: LicensePlate;
  size?: 'sm' | 'md';
}

export const IranianPlateBadge: React.FC<IranianPlateBadgeProps> = ({ plate, size = 'md' }) => {
  const isTaxiPlate = plate.letter === 'ت' || plate.letter === 'ع';
  const heightCls = size === 'sm' ? 'h-9 text-sm' : 'h-11 text-base sm:text-lg';
  const stripW = size === 'sm' ? 'w-6' : 'w-7';
  const iranW = size === 'sm' ? 'w-11' : 'w-14';

  return (
    <div
      dir="ltr"
      aria-label={`پلاک خودرو ${plate.left2} ${plate.letter} ${plate.right3} ایران ${plate.iranCode}`}
      className={`inline-flex items-stretch overflow-hidden rounded-lg border-2 border-slate-700 font-extrabold shadow-md select-none ${heightCls} ${
        isTaxiPlate ? 'bg-amber-300 text-slate-950' : 'bg-slate-100 text-slate-950'
      }`}
    >
      {/* Left I.R. IRAN blue strip */}
      <div
        className={`${stripW} flex flex-col items-center justify-between bg-blue-700 py-1 text-[7px] font-bold leading-none text-white shrink-0`}
      >
        <div className="flex w-3.5 flex-col overflow-hidden rounded-[1px]">
          <span className="h-[2px] bg-emerald-500" />
          <span className="h-[2px] bg-white" />
          <span className="h-[2px] bg-rose-600" />
        </div>
        <div className="text-center leading-[1.05]">
          <div>I.R.</div>
          <div>IRAN</div>
        </div>
      </div>

      {/* Main digits and letter */}
      <div className="flex items-center gap-1.5 px-2.5 tabular-nums tracking-tight">
        <span>{toPersianDigits(plate.left2 || '--')}</span>
        <span className="text-[1.05em] font-black">{plate.letter || 'ت'}</span>
        <span>{toPersianDigits(plate.right3 || '---')}</span>
      </div>

      {/* Right IRAN city code */}
      <div
        className={`${iranW} flex flex-col items-center justify-center border-l-2 border-slate-700/70 px-1.5 leading-none shrink-0`}
      >
        <span className="text-[9px] font-bold text-slate-800">ایران</span>
        <span className="mt-0.5 text-sm sm:text-base font-black tabular-nums">
          {toPersianDigits(plate.iranCode || '--')}
        </span>
      </div>
    </div>
  );
};

interface IranianPlateInputProps {
  plate: LicensePlate;
  onChange: (next: LicensePlate) => void;
  hasError?: boolean;
}

export const IranianPlateInput: React.FC<IranianPlateInputProps> = ({
  plate,
  onChange,
  hasError = false,
}) => {
  const isTaxiPlate = plate.letter === 'ت' || plate.letter === 'ع';

  return (
    <div
      dir="ltr"
      className={`flex items-stretch overflow-hidden rounded-xl border-2 transition-colors ${
        hasError
          ? 'border-rose-500/80 ring-2 ring-rose-500/20'
          : 'border-slate-600 focus-within:border-emerald-400'
      } ${isTaxiPlate ? 'bg-amber-300 text-slate-950' : 'bg-slate-100 text-slate-950'}`}
    >
      {/* Blue IR strip */}
      <div className="flex w-8 flex-col items-center justify-between bg-blue-700 py-1.5 text-[8px] font-bold leading-none text-white shrink-0">
        <div className="flex w-4 flex-col overflow-hidden rounded-[1px]">
          <span className="h-[2.5px] bg-emerald-500" />
          <span className="h-[2.5px] bg-white" />
          <span className="h-[2.5px] bg-rose-600" />
        </div>
        <div className="text-center leading-[1.05]">
          <div>I.R.</div>
          <div>IRAN</div>
        </div>
      </div>

      {/* 2 digits */}
      <div className="flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5">
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          aria-label="دو رقم سمت چپ پلاک"
          placeholder="۴۸"
          value={plate.left2}
          onChange={(e) => onChange({ ...plate, left2: onlyDigits(e.target.value, 2) })}
          className="h-10 w-12 rounded-lg bg-white/70 text-center text-lg font-black text-slate-950 placeholder:text-slate-500 focus:bg-white focus:outline-none tabular-nums"
        />

        {/* Persian letter selector */}
        <select
          aria-label="حرف پلاک"
          value={plate.letter}
          onChange={(e) => onChange({ ...plate, letter: e.target.value })}
          className="h-10 rounded-lg bg-white/80 px-2 text-center text-base font-black text-slate-950 focus:bg-white focus:outline-none cursor-pointer"
        >
          {PERSIAN_PLATE_LETTERS.map((letter) => (
            <option key={letter} value={letter}>
              {letter === 'ت' ? 'ت (تاکسی)' : letter === 'ع' ? 'ع (عمومی)' : letter}
            </option>
          ))}
        </select>

        {/* 3 digits */}
        <input
          type="text"
          inputMode="numeric"
          maxLength={3}
          aria-label="سه رقم وسط پلاک"
          placeholder="۷۲۴"
          value={plate.right3}
          onChange={(e) => onChange({ ...plate, right3: onlyDigits(e.target.value, 3) })}
          className="h-10 w-16 rounded-lg bg-white/70 text-center text-lg font-black text-slate-950 placeholder:text-slate-500 focus:bg-white focus:outline-none tabular-nums"
        />
      </div>

      {/* City code */}
      <div className="flex w-16 flex-col items-center justify-center border-l-2 border-slate-700/60 px-1.5 py-1 shrink-0">
        <span className="text-[10px] font-bold text-slate-800 leading-none mb-0.5">ایران</span>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          aria-label="کد شهر پلاک (ایران)"
          placeholder="۱۱"
          value={plate.iranCode}
          onChange={(e) => onChange({ ...plate, iranCode: onlyDigits(e.target.value, 2) })}
          className="h-7 w-11 rounded-md bg-white/70 text-center text-base font-black text-slate-950 placeholder:text-slate-500 focus:bg-white focus:outline-none tabular-nums"
        />
      </div>
    </div>
  );
};
