
import React, { useState, useRef } from 'react';
import { askGemini } from "../services/gemini";
import { TranslationSet, Language } from '../types';
await askGemini("Diagnose crop disease from symptoms...");

interface Props {
  lang: Language;
  t: TranslationSet;
  onClose: () => void;
}

export const CropDiagnostic: React.FC<Props> = ({ lang, t, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      alert("Camera access denied or unavailable.");
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const data = canvasRef.current.toDataURL('image/jpeg');
        setPhoto(data);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleDiagnose = async () => {
    if (!photo) return;
    setLoading(true);
    const base64 = photo.split(',')[1];
    const result = await askGemini(
  "Analyze this plant image for diseases and suggest organic treatment."
);

    setDiagnosis(result);
    setLoading(false);
  };

  const reset = () => {
    setPhoto(null);
    setDiagnosis(null);
    startCamera();
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 right-6 z-[130]">
        <button onClick={() => { stopCamera(); onClose(); }} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="w-full max-w-lg aspect-[3/4] bg-slate-900 rounded-[40px] overflow-hidden relative shadow-2xl">
        {!photo ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-[2px] border-white/20 pointer-events-none flex items-center justify-center">
               <div className="w-64 h-64 border-2 border-emerald-500 rounded-3xl opacity-50"></div>
            </div>
            <div className="absolute bottom-10 left-0 right-0 flex justify-center">
              <button onClick={takePhoto} className="w-20 h-20 bg-white rounded-full border-[6px] border-emerald-600 shadow-xl active:scale-90 transition-transform"></button>
            </div>
          </>
        ) : (
          <div className="w-full h-full relative">
            <img src={photo} className="w-full h-full object-cover" />
            {loading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-center items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="font-black uppercase tracking-widest text-xs">Analyzing Leaf Health...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-lg mt-6">
        {photo && !diagnosis && !loading && (
          <div className="flex gap-4">
            <button onClick={reset} className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold border border-white/20">Retake</button>
            <button onClick={handleDiagnose} className="flex-2 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-emerald-900/40">Analyze with AI</button>
          </div>
        )}

        {diagnosis && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-h-[40vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-xl">🧬</span> AI Diagnosis
            </h3>
            <div className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
              {diagnosis}
            </div>
            <button onClick={reset} className="w-full mt-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">New Scan</button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
