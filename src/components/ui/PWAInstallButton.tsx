import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2F7D4A] text-white hover:bg-[#173F2A] transition shadow-xs cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#D8C4A8] text-[#173F2A] hover:bg-white/80 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#2F7D4A]" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#FFFDF7] p-6 shadow-xl border border-[#D8C4A8]">
              <h3 className="text-base font-semibold text-[#173F2A]">Instalar no iPhone / iPad</h3>
              <p className="mt-3 text-sm text-[#6B4A35] leading-relaxed">
                1. Toque no botão de <strong>Compartilhar</strong> na barra do Safari.<br />
                2. Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#2F7D4A] py-2.5 text-sm font-medium text-white hover:bg-[#173F2A] transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
