import type { DriverProfile } from '../types/driver';
import { detectIranianBank, formatCardGroups } from './iranBanks';
import { formatToman, toPersianDigits } from './persianNumbers';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function exportDriverQrStickerPng(
  profile: DriverProfile,
  qrCanvasElement: HTMLCanvasElement | null
): Promise<boolean> {
  if (!qrCanvasElement) return false;

  // Make sure the self-hosted font is ready before drawing on canvas
  try {
    await Promise.all(
      ['400', '500', '600', '700', '800'].map((w) =>
        document.fonts.load(`${w} 32px Vazirmatn`, 'کرایه‌چی ۱۲۳ 123')
      )
    );
  } catch {
    // fall back to system fonts
  }

  const width = 900;
  const height = 1240;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const bank = detectIranianBank(profile.cardNumber);

  // Outer card background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0F172A');
  bgGrad.addColorStop(0.55, '#162238');
  bgGrad.addColorStop(1, '#0B1324');
  ctx.fillStyle = bgGrad;
  roundRectPath(ctx, 0, 0, width, height, 48);
  ctx.fill();

  // Subtle emerald & amber glow accents
  const topGlow = ctx.createRadialGradient(450, 120, 40, 450, 120, 480);
  topGlow.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
  topGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, width, 560);

  // Border frame
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
  ctx.lineWidth = 4;
  roundRectPath(ctx, 18, 18, width - 36, height - 36, 40);
  ctx.stroke();

  // Top Header Strip
  ctx.direction = 'rtl';
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 54px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('کرایهچی', width / 2, 108);

  ctx.fillStyle = '#F59E0B';
  ctx.font = '600 26px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText('پرداخت سریع و امن کرایه با اسکن کد QR', width / 2, 156);

  // White high-contrast QR container
  const qrBoxSize = 480;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 200;
  ctx.fillStyle = '#FFFFFF';
  roundRectPath(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 36);
  ctx.fill();

  // Draw crisp QR canvas inside white box
  const qrPadding = 34;
  ctx.drawImage(
    qrCanvasElement,
    qrBoxX + qrPadding,
    qrBoxY + qrPadding,
    qrBoxSize - qrPadding * 2,
    qrBoxSize - qrPadding * 2
  );

  // Fare badge
  ctx.fillStyle = profile.fareMode === 'fixed' ? '#10B981' : '#F59E0B';
  ctx.font = 'bold 34px Vazirmatn, Tahoma, sans-serif';
  const fareLabel =
    profile.fareMode === 'fixed'
      ? `کرایه ثابت: ${formatToman(profile.fixedAmount)} تومان`
      : 'مبلغ دلخواه مسافر (تومان)';
  ctx.fillText(fareLabel, width / 2, 745);

  // Driver Name & Car Model
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 42px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(profile.name.trim(), width / 2, 825);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 28px Vazirmatn, Tahoma, sans-serif';
  ctx.fillText(profile.carModel.trim(), width / 2, 875);

  // Iranian Plate Graphic
  ctx.direction = 'ltr';
  const plateW = 460;
  const plateH = 92;
  const plateX = (width - plateW) / 2;
  const plateY = 915;
  ctx.fillStyle = '#F8FAFC';
  roundRectPath(ctx, plateX, plateY, plateW, plateH, 14);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Blue IR strip on left side of plate
  ctx.fillStyle = '#1D4ED8';
  roundRectPath(ctx, plateX + 4, plateY + 4, 54, plateH - 8, 10);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('I.R.', plateX + 31, plateY + 52);
  ctx.fillText('IRAN', plateX + 31, plateY + 72);

  // Plate divider on right
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(plateX + plateW - 108, plateY + 8);
  ctx.lineTo(plateX + plateW - 108, plateY + plateH - 8);
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px Vazirmatn, sans-serif';
  ctx.fillText('ایران', plateX + plateW - 54, plateY + 30);
  ctx.font = 'bold 34px Vazirmatn, sans-serif';
  ctx.fillText(toPersianDigits(profile.plate.iranCode), plateX + plateW - 54, plateY + 72);

  // Main plate number
  ctx.font = 'bold 42px Vazirmatn, sans-serif';
  const plateCenterText = `${toPersianDigits(profile.plate.left2)}  ${profile.plate.letter}  ${toPersianDigits(profile.plate.right3)}`;
  ctx.fillText(plateCenterText, plateX + 206, plateY + 61);

  // Card info strip at bottom
  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
  roundRectPath(ctx, 70, 1042, width - 140, 128, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.direction = 'rtl';
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '600 24px Vazirmatn, sans-serif';
  ctx.fillText(bank.name, width / 2, 1090);

  ctx.direction = 'ltr';
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 34px monospace';
  ctx.fillText(formatCardGroups(profile.cardNumber, false), width / 2, 1140);

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `kerayehchi-${profile.plate.left2}-${profile.plate.right3}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
