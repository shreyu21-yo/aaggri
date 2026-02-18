import React, { useEffect, useState } from 'react';

export const Splash: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onFinish, 600); 
    }, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-emerald-600 transition-all duration-700 ease-in-out ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100 scale-100'}`}>
      <div className="relative">
        {/* Animated background rings */}
        <div className="absolute inset-0 w-32 h-32 bg-white/20 rounded-full animate-ping"></div>
        <div className="absolute inset-0 w-32 h-32 bg-white/10 rounded-full animate-pulse delay-75"></div>
        
        <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center splash-logo shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
          <svg className="w-16 h-16 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2zM12 15.96l-3.35 1.48 3.35-8.21 3.35 8.21L12 15.96z"/>
          </svg>
        </div>
      </div>
      
      <div className={`mt-10 text-center transition-all duration-1000 delay-300 ${isExiting ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <h1 className="text-4xl font-black text-white tracking-[0.2em] uppercase">AgriConnect</h1>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-8 h-px bg-emerald-300/50"></div>
          <p className="text-emerald-100 font-medium text-sm uppercase tracking-widest">Bridging the Farm</p>
          <div className="w-8 h-px bg-emerald-300/50"></div>
        </div>
      </div>

      {/* Loading indicator at bottom */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>
    </div>
  );
};