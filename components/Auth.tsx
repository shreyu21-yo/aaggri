import React, { useState, useEffect } from 'react';
import { LanguageSelector } from './LanguageSelector';
import { Language, TranslationSet } from '../types';

interface Props {
  onAuth: (data: {
  name: string;
  phone: string;
  password: string;
  isRegister: boolean;
}) => Promise<string | null>;

  lang: Language;
  t: TranslationSet;
  setLang: (l: Language) => void;
}

export const Auth: React.FC<Props> = ({ onAuth, lang, t, setLang }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [isRegister, phone, name, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (phone.length < 10) {
    setError(lang === 'en' ? "Please enter a valid 10-digit phone number" : t.phone);
    return;
  }

  if (isRegister && password !== confirmPassword) {
    setError(t.passwordMismatch);
    return;
  }

  if (password.length < 6) {
    setError(lang === 'en' ? "Password must be at least 6 characters" : t.password);
    return;
  }

  const errMsg = await onAuth({
    name,
    phone,
    password,
    isRegister,
  });

  if (errMsg) {
    setError(errMsg);
  }
};


  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full -z-0"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-emerald-600 rounded-[24px] mx-auto flex items-center justify-center mb-6 shadow-xl shadow-emerald-100 rotate-3 hover:rotate-0 transition-transform duration-300">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/>
                </svg>
              </div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">AgriConnect</h1>
              <p className="text-slate-400 mt-2 font-medium">{isRegister ? t.signup : t.login}</p>
            </div>
            
            <div className="mb-8">
              <LanguageSelector currentLang={lang} onSelect={setLang} />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-1 rounded-full text-red-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </div>
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t.name}</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-5 py-4 border-2 border-slate-50 rounded-2xl bg-slate-50 outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold" 
                    placeholder="e.g. Ramesh Singh"
                    value={name} 
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t.phone}</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">+91</span>
                  <input 
                    type="tel" 
                    required 
                    pattern="[0-9]{10}" 
                    className="w-full pl-16 pr-5 py-4 border-2 border-slate-50 rounded-2xl bg-slate-50 outline-none focus:bg-white focus:border-emerald-500 transition-all font-semibold tracking-wider" 
                    placeholder="9876543210" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t.password}</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className="w-full px-5 py-4 border-2 border-slate-50 rounded-2xl bg-slate-50 outline-none focus:bg-white focus:border-emerald-500 transition-all pr-14 font-semibold" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors p-2"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t.confirmPassword}</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className={`w-full px-5 py-4 border-2 rounded-2xl bg-slate-50 outline-none focus:bg-white transition-all font-semibold ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-slate-50 focus:border-emerald-500'}`} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-red-500 mt-1 font-bold uppercase tracking-wider pl-1">{t.passwordMismatch}</p>
                  )}
                </div>
              )}

              <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-100 mt-4 hover:bg-emerald-700 hover:shadow-emerald-200 transition-all active:scale-[0.97] tracking-widest uppercase text-sm">
                {isRegister ? t.signup : t.login}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsRegister(!isRegister)} 
                className="text-slate-400 font-bold text-sm hover:text-emerald-600 transition-colors py-2 px-4 rounded-xl"
              >
                {isRegister ? t.alreadyAccount : t.noAccount}
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer brand info */}
        <p className="mt-8 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Secure Agricultural Network v2.0</p>
      </div>
    </div>
  );
};