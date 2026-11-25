import React, { useState } from 'react';
import { Copy, Wifi } from 'lucide-react';
import { detectIranianBank, formatCardGroups } from '../utils/iranBanks';

interface BankCard3DProps {
  cardNumber: string;
  holderName: string;
  onCopyClick?: () => void;
  subtitle?: string;
}

export const BankCard3D: React.FC<BankCard3DProps> = ({
  cardNumber,
  holderName,
  onCopyClick,
  subtitle = 'برای کپی شماره کارت لمس کنید',
}) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const bank = detectIranianBank(cardNumber);
  const formatted = formatCardGroups(cardNumber, false) || '•••• - •••• - •••• - ••••';

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 14;
    const rx = (0.5 - py) * 12;
    setTilt({
      rx,
      ry,
      gx: Math.round(px * 100),
      gy: Math.round(py * 100),
    });
  };

  const resetTilt = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  };

  const cardInner = (
    <div
      className="tilt-card-motion preserve-3d relative w-full overflow-hidden rounded-3xl border border-white/15 p-5 sm:p-6 shadow-2xl transition-transform duration-200 ease-out"
      style={{
        background: `linear-gradient(135deg, ${bank.gradientFrom} 0%, ${bank.gradientTo} 100%)`,
        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
    >
      {/* Dynamic specular glass sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 60%)`,
        }}
      />

      {/* Geometric Neo-Bank ring accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-14 -bottom-16 h-48 w-48 rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-6 -bottom-8 h-32 w-32 rounded-full border border-white/10"
      />

      {/* Card Top Row: Bank mark + Contactless */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 min-w-[36px] items-center justify-center rounded-xl border border-white/20 bg-white/10 px-2 text-xs font-extrabold text-white backdrop-blur-md"
            style={{ color: bank.accentColor }}
          >
            {bank.markText}
          </span>
          <div className="text-right">
            <div className="text-sm font-bold text-white leading-tight">{bank.name}</div>
            <div className="text-[11px] text-white/70">شبکه پرداخت شتاب</div>
          </div>
        </div>

        <Wifi className="h-5 w-5 rotate-90 text-white/75 shrink-0" aria-hidden="true" />
      </div>

      {/* EMV Metallic Chip */}
      <div className="relative z-10 mt-5 flex items-center justify-between">
        <div
          aria-hidden="true"
          className="h-8 w-11 rounded-lg border border-amber-200/40 bg-gradient-to-br from-amber-200/90 via-amber-300/75 to-amber-500/80 shadow-inner"
        >
          <div className="grid h-full w-full grid-cols-3 gap-[1px] p-1 opacity-40">
            <span className="border-r border-slate-900" />
            <span className="border-r border-slate-900" />
            <span />
          </div>
        </div>

        {onCopyClick && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/85">
            <Copy className="h-3.5 w-3.5" />
            <span>کپی لمسی</span>
          </span>
        )}
      </div>

      {/* 16-digit card number in crisp LTR tabular figures (single-line responsive) */}
      <div
        dir="ltr"
        className="relative z-10 mt-5 flex items-center justify-center gap-2 sm:gap-3 font-mono text-[15px] sm:text-xl font-bold tracking-normal sm:tracking-wider text-white tabular-nums whitespace-nowrap drop-shadow-sm"
      >
        {formatted.split(' - ').map((group, idx) => (
          <span key={idx}>{group}</span>
        ))}
      </div>

      {/* Bottom Row: Cardholder Name + Action hint */}
      <div className="relative z-10 mt-5 flex items-end justify-between gap-3 border-t border-white/15 pt-3">
        <div className="min-w-0 text-right">
          <div className="text-[11px] text-white/65">به نام</div>
          <div className="truncate text-sm font-bold text-white">
            {holderName.trim() || 'نام راننده'}
          </div>
        </div>
        <div className="text-[11px] font-medium text-emerald-200/90 shrink-0">{subtitle}</div>
      </div>
    </div>
  );

  if (onCopyClick) {
    return (
      <button
        type="button"
        onClick={onCopyClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        aria-label={`کپی شماره کارت ${bank.name} به نام ${holderName}`}
        className="perspective-1000 block w-full text-right cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-3xl active:scale-[0.985] transition-transform"
      >
        {cardInner}
      </button>
    );
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      className="perspective-1000 w-full"
    >
      {cardInner}
    </div>
  );
};
