import React from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from './useOnlineStatus';

interface OfflineIndicatorProps {
  pendingMutationsCount?: number;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  pendingMutationsCount = 0,
}) => {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-2 text-xs">
      {!isOnline ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D99A22]/20 text-[#6B4A35] font-medium border border-[#D99A22]/40">
          <CloudOff className="w-3.5 h-3.5 text-[#D99A22]" />
          <span>Modo Campo (Offline)</span>
        </span>
      ) : pendingMutationsCount > 0 ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8BCF9B]/20 text-[#173F2A] font-medium border border-[#2F7D4A]/20">
          <RefreshCw className="w-3 h-3 text-[#2F7D4A] animate-spin" />
          <span>Sincronizando ({pendingMutationsCount})</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
          <Cloud className="w-3.5 h-3.5 text-[#2F7D4A]" />
          <span className="hidden sm:inline">Conectado</span>
        </span>
      )}
    </div>
  );
};
