import React, { useState, useRef, useEffect } from 'react';
import { askGemini } from "../services/gemini";
import { TranslationSet, Language } from '../types';

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

    const result = await askGemini(
      "A farmer uploaded a plant leaf image. Suggest possible diseases and organic treatments based on common crop issues."
    );

    setDiagnosis(result);
    setLoading(false);
  };

  const reset = () => {
    setPhoto(null);
    setDiagnosis(null);
    startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 right-6 z-[130]">
        <button onClick={() => { stopCamera(); onClose(); }} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
          ✖
        </button>
      </div>

      <div className="w-full max-w-lg aspect-[3/4] bg-slate-900 rounded-[40px] overflow-hidden relative shadow-2xl">
        {!photo ? (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-10 left-0 right-0 flex justify-center">
              <button onClick={takePhoto} className="w-20 h-20 bg-white rounded-full border-[6px] border-emerald-600"></button>
            </div>
          </>
        ) : (
          <div className="w-full h-full relative">
            <img src={photo} className="w-full h-full object-cover" />
            {loading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                Analyzing...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-lg mt-6">
        {photo && !diagnosis && !loading && (
          <button onClick={handleDiagnose} className="w-full bg-emerald-600 text-white py-4 rounded-2xl">
            Analyze with AI
          </button>
        )}

        {diagnosis && (
          <div className="bg-white rounded-3xl p-6 mt-4">
            <h3 className="font-bold mb-2">AI Diagnosis</h3>
            <p>{diagnosis}</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
