import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-2xl bg-amber-500/95 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xl backdrop-blur-md"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>حالت آفلاین · اطلاعات ذخیره‌شده فعال است</span>
    </div>
  );
};
