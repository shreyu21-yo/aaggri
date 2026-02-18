
import React, { useState } from 'react';
import { User, Role, TranslationSet } from '../types';

interface Props {
  user: User;
  onComplete: (updatedUser: User) => void;
  t: TranslationSet;
}

export const ProfileSetup: React.FC<Props> = ({ user, onComplete, t }) => {
  const [formData, setFormData] = useState<Partial<User>>({ location: '', bankAccount: '', ifsc: '', ...user });
  const [locLoading, setLocLoading] = useState(false);

  const handleGetCurrentLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setFormData(prev => ({ ...prev, location: `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}` }));
        setLocLoading(false);
      },
      () => setLocLoading(false)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ ...user, ...formData } as User);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-xl border">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.completeProfile}</h2>
        <p className="text-slate-500 mb-6 italic">{t.profileGreeting}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700">{t.detailedLocation}</label>
              <div className="relative">
                <input type="text" required className="w-full px-4 py-3 pr-12 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}/>
                <button type="button" onClick={handleGetCurrentLocation} className="absolute right-3 top-3 text-emerald-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  {locLoading ? "..." : "📍"}
                </button>
              </div>
            </div>

            {user.role === 'FARMER' && (
              <>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4 border-b pb-1">{t.payoutInfo}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-bold">{t.bankAccountNo}</label><input type="text" required className="w-full px-4 py-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})}/></div>
                  <div><label className="text-sm font-bold">{t.ifscCode}</label><input type="text" required className="w-full px-4 py-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value})}/></div>
                </div>
              </>
            )}
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg mt-6 active:scale-95 transition-all">{t.completeReg}</button>
        </form>
      </div>
    </div>
  );
};
