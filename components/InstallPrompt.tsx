
import React, { useState, useEffect } from 'react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    });

    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[200] animate-in slide-in-from-bottom duration-500">
      <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-xl">🌱</div>
          <div>
            <p className="text-sm font-black">Install AgriConnect</p>
            <p className="text-[10px] text-slate-400">Fast, offline-ready marketplace</p>
          </div>
        </div>
        <button 
          onClick={handleInstall}
          className="bg-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          Install
        </button>
      </div>
    </div>
  );
};
