import React, { useState, useEffect, useCallback } from 'react';
import { FarmingTip, TranslationSet, Language } from '../types';
import { getFarmingTips } from '../services/gemini';

interface Props {
  location: string;
  lang: Language;
  t: TranslationSet;
}

export const FarmingTips: React.FC<Props> = ({ location, lang, t }) => {
  const [tips, setTips] = useState<FarmingTip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTips = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getFarmingTips(location, lang);
      if (data && data.tips && Array.isArray(data.tips)) {
        setTips(data.tips);
      } else {
        throw new Error("INVALID_FORMAT");
      }
    } catch (err: any) {
      console.error("Farming tips component error:", err);
      
      let errorMessage = "Failed to connect to AI. Please check your internet connection and try again.";
      
      if (err.message === "API_KEY_MISSING") {
        errorMessage = "API Key is missing. Please ensure your environment is configured correctly.";
      } else if (err.message === "INVALID_API_KEY") {
        errorMessage = "The provided API Key is invalid or restricted. Please ensure the 'Generative Language API' is enabled in your Google Cloud Console.";
      } else if (err.message === "MODEL_NOT_FOUND") {
        errorMessage = "The requested AI model is not available for this API key. Try checking your region and key permissions.";
      } else if (err.status === 429) {
        errorMessage = "Rate limit exceeded. Please wait a moment before refreshing.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [location, lang]);

  useEffect(() => {
    fetchTips();
  }, [fetchTips]);

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('soil')) return '🪴';
    if (cat.includes('crop')) return '🌾';
    if (cat.includes('weather')) return '🌦️';
    if (cat.includes('market')) return '📈';
    if (cat.includes('pest')) return '🐛';
    return '💡';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-[28px] border shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-800">{t.farmingTips}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {t.localizedFor} <span className="text-emerald-600">{location}</span>
          </p>
        </div>
        <button 
          onClick={fetchTips} 
          disabled={loading}
          className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all disabled:opacity-50 active:scale-95 border border-emerald-100 shadow-inner"
          title={t.refreshTips}
        >
          <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-[32px] border animate-pulse space-y-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
              <div className="h-5 bg-slate-100 rounded-full w-2/3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-50 rounded-full w-full"></div>
                <div className="h-3 bg-slate-50 rounded-full w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-red-100 rounded-[32px] p-10 text-center shadow-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-4xl mb-6 shadow-inner">🚨</div>
          <div className="space-y-2 mb-6">
            <p className="text-slate-800 font-black text-lg">Connection Error</p>
            <p className="text-slate-500 text-sm font-medium px-4">{error}</p>
          </div>
          <button 
            onClick={fetchTips}
            className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-100"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[32px] border shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform border border-emerald-100/50">
                  {getIcon(tip.category)}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 leading-tight">{tip.title}</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 opacity-60">{tip.category}</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {tip.content}
              </p>
            </div>
          ))}
          {!loading && tips.length === 0 && !error && (
            <div className="col-span-full py-16 text-center text-slate-400 italic font-medium">
              No specific tips generated for this location yet. Click refresh to try again.
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl flex flex-col md:flex-row items-center gap-6 overflow-hidden relative border border-white/10">
        <div className="absolute top-0 right-0 opacity-10 scale-150 rotate-12 -mr-10 -mt-10">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
        </div>
        <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-3xl shrink-0 shadow-xl shadow-emerald-900/50">🤖</div>
        <div className="relative z-10 text-center md:text-left">
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-2">Advice</p>
          <p className="text-base font-bold text-slate-200 leading-relaxed">
            Our AI model analyzes local environment data to provide precision farming advice.
          </p>
        </div>
      </div>
    </div>
  );
};