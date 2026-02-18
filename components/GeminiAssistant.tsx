import React, { useState, useRef, useEffect } from 'react';
import { agriChat } from '../services/gemini';
import { Language, TranslationSet } from '../types';

interface Props {
  lang: Language;
  t: TranslationSet;
  location?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const GeminiAssistant: React.FC<Props> = ({ lang, t, location }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setMessages([{ role: 'model', text: t.botGreeting }]);
  }, [lang, t.botGreeting]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Handle Esc key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = lang === 'en' ? 'en-IN' : (lang === 'hi' ? 'hi-IN' : 'en-IN');

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [lang]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await agriChat(userMsg, history, lang, location);
    setMessages(prev => [...prev, { role: 'model', text: response || "I'm sorry, I couldn't process that." }]);
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="Open Chatbot"
        className="fixed bottom-6 right-6 w-16 h-16 bg-emerald-600 text-white rounded-[24px] shadow-2xl z-[150] flex items-center justify-center hover:scale-110 hover:rotate-3 active:scale-90 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <svg className="w-8 h-8 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop for closing by clicking outside */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[155] animate-in fade-in duration-300"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="fixed inset-x-4 bottom-4 top-20 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[420px] sm:h-[680px] z-[160] bg-white/95 backdrop-blur-2xl sm:rounded-[40px] rounded-[32px] flex flex-col shadow-[0_32px_128px_rgba(0,0,0,0.15)] border border-white/40 animate-in slide-in-from-bottom-12 fade-in duration-500 overflow-hidden">
            {/* Custom Header */}
            <div className="px-8 py-8 bg-emerald-600/5 border-b border-emerald-100/10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl">🤖</div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-800 leading-none">AgriBot <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg ml-1">v2.1</span></h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Voice Enabled AI</p>
                  </div>
                </div>
                {/* Close Button */}
                <button 
                  onClick={() => setIsOpen(false)} 
                  aria-label="Close Chat"
                  className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm active:scale-90"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm ${m.role === 'user' ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>
                    {m.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className={`max-w-[85%] p-5 rounded-[24px] text-[15px] font-medium leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-end gap-3 flex-row animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">🤖</div>
                  <div className="bg-white p-5 rounded-[24px] rounded-bl-none border border-slate-100 flex gap-1.5 items-center shadow-sm">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Input */}
            <form onSubmit={handleSend} className="p-8 bg-white/50 backdrop-blur-md border-t border-emerald-50">
              <div className="relative group flex items-center gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder={isListening ? "Listening..." : t.botInputPlaceholder} 
                    className={`w-full pl-6 pr-12 py-4 bg-white border rounded-[20px] outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-semibold text-[15px] shadow-sm ${isListening ? 'border-emerald-500 text-emerald-600 animate-pulse' : 'border-slate-200 text-slate-800'}`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                  />
                  {/* Microphone Button Inside Input */}
                  <button 
                    type="button"
                    onClick={toggleListening}
                    aria-label={isListening ? "Stop listening" : "Start voice input"}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v5a3 3 0 01-6 0V5a3 3 0 013-3z"/>
                    </svg>
                  </button>
                </div>

                <button 
                  type="submit" 
                  aria-label="Send message"
                  className="w-12 h-12 bg-emerald-600 text-white rounded-[18px] flex items-center justify-center shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-90 transition-all disabled:opacity-50 disabled:scale-95"
                  disabled={!input.trim() || loading || isListening}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
              <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-4">AI may provide inaccurate agricultural advice. Consult local experts.</p>
            </form>
          </div>
        </>
      )}
    </>
  );
};