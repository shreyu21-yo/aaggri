
import React, { useState, useEffect } from 'react';
import { TranslationSet, Crop } from '../types';

interface Props {
  crop: Crop;
  t: TranslationSet;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentGateway: React.FC<Props> = ({ crop, t, onSuccess, onCancel }) => {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step === 'processing') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('success'), 500);
            return 100;
          }
          return p + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-50 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in duration-300">
        <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black">₹</div>
            <h2 className="font-bold tracking-tight">{t.paymentTitle}</h2>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6">
          {step === 'details' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-3xl border shadow-sm">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t.amountPaid}</p>
                <p className="text-4xl font-black text-slate-800">₹{crop.price * 10}</p>
                <div className="mt-4 pt-4 border-t flex items-center gap-3">
                   <img src={crop.image} className="w-10 h-10 rounded-lg object-cover" />
                   <div>
                     <p className="text-sm font-bold text-slate-800">{crop.name}</p>
                     <p className="text-[10px] text-slate-400">Escrow Protected Transaction</p>
                   </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                 <div className="text-blue-600">🛡️</div>
                 <p className="text-[11px] leading-relaxed text-blue-800 font-medium">{t.escrowNotice}</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => setStep('processing')}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200 active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                  Pay via UPI / Cards
                </button>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by AgriConnect Pay</p>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative w-20 h-20 mb-6">
                <svg className="w-full h-full rotate-[-90deg]">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#e2e8f0" strokeWidth="8"/>
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray={`${progress * 2.2}, 1000`} className="transition-all duration-100"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-black text-slate-800">
                  {progress}%
                </div>
              </div>
              <p className="font-bold text-slate-800 animate-pulse">{t.processing}</p>
              <p className="text-xs text-slate-400 mt-2">Do not close the app or press back</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center animate-in slide-in-from-bottom duration-500">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 scale-up">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">{t.paymentSuccess}</h3>
              <p className="text-sm text-slate-500 mb-8 px-6">Your payment of <span className="font-black text-slate-800">₹{crop.price * 10}</span> is now safe in platform escrow.</p>
              
              <button 
                onClick={onSuccess}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100"
              >
                {t.done}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .scale-up {
          animation: scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes scaleUp {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
