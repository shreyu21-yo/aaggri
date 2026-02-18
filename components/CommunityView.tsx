
import React, { useState, useEffect, useCallback } from 'react';
import { User, Crop, Transaction, TranslationSet, CommunityTip, Language } from '../types';
import { askGemini } from "../services/gemini";
await askGemini(`Give community coordination tips for farmers in ${location}`);


interface Props {
  user: User;
  users: User[];
  crops: Crop[];
  transactions: Transaction[];
  onVerify: (userId: string) => void;
  onProxyRegister: (farmerData: Partial<User>) => void;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onVerifyCrop: (cropId: string) => void;
  addCrop: (c: Crop) => void;
  t: TranslationSet;
  lang: Language;
}

export const CommunityView: React.FC<Props> = ({ 
  user, users, crops, transactions, onVerify, onProxyRegister, onUpdateTransaction, onVerifyCrop, addCrop, t, lang 
}) => {
  const [activeTab, setActiveTab] = useState<'verification' | 'farmers' | 'map' | 'strategy'>('verification');
  const [showRegForm, setShowRegForm] = useState(false);
  const [showCropForm, setShowCropForm] = useState<User | null>(null);
  const [proxyData, setProxyData] = useState<Partial<User>>({ name: '', phone: '', location: user.location });
  
  const [newCrop, setNewCrop] = useState<Partial<Crop>>({
    name: '',
    price: 0,
    quantity: 0,
    description: '',
    category: 'Vegetables',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400'
  });
  const [descLoading, setDescLoading] = useState(false);

  const [tips, setTips] = useState<CommunityTip[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserCoords({ lat: 30.901, lng: 75.857 }) 
    );
  }, []);

  const isRegional = useCallback((otherLoc?: string) => {
    if (!user.location || !otherLoc) return false;
    const cleanUserLoc = user.location.toLowerCase().trim();
    const cleanOtherLoc = otherLoc.toLowerCase().trim();
    return cleanOtherLoc.includes(cleanUserLoc) || cleanUserLoc.includes(cleanOtherLoc);
  }, [user.location]);

  const regionalFarmers = users.filter(u => u.role === 'FARMER' && (u.coords || isRegional(u.location)));
  const unverifiedRegionalUserRequests = users.filter(f => f.role === 'FARMER' && !f.verified && f.verificationRequested && isRegional(f.location));
  
  const regionalCropRequests = crops.filter(c => {
    if (!c.verificationRequested || c.verified) return false;
    const farmer = users.find(u => u.id === c.farmerId);
    return farmer && isRegional(farmer.location);
  });

  const totalRequests = unverifiedRegionalUserRequests.length + regionalCropRequests.length;
  const verifiedRegionalFarmers = regionalFarmers.filter(f => f.verified);

  const fetchStrategy = useCallback(async () => {
    setTipsLoading(true);
    try {
      const data = await getCommunityTips(user.location || "Punjab", 'en');
      setTips(data.tips || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTipsLoading(false);
    }
  }, [user.location]);

  useEffect(() => {
    if (activeTab === 'strategy' && tips.length === 0) fetchStrategy();
  }, [activeTab, tips.length, fetchStrategy]);

  const handleAutoDesc = async () => {
    if (!newCrop.name) return;
    setDescLoading(true);
    const desc = await generateCropDescription(newCrop.name, lang);
    setNewCrop(prev => ({ ...prev, description: desc || '' }));
    setDescLoading(false);
  };

  const handleAddProxyCrop = (e: React.FormEvent) => {
  e.preventDefault();

  if (!showCropForm) {
    console.error("No farmer selected");
    return;
  }

  if (
    !newCrop.name ||
    !newCrop.price ||
    !newCrop.quantity ||
    !newCrop.description
  ) {
    alert("Please fill all crop details");
    return;
  }

  const crop: Crop = {
    id: `PROXY-CROP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    farmerId: showCropForm._id || showCropForm.id,


    farmerName: showCropForm.name,
    farmerPhone: showCropForm.phone,
    farmerLocation: showCropForm.location,

    name: newCrop.name,
    price: Number(newCrop.price),
    quantity: Number(newCrop.quantity),
    unit: "kg",
    description: newCrop.description,
    category: newCrop.category || "Vegetables",
    image: newCrop.image,

    verified: true,
    verificationRequested: false,
    isSold: false,
  };

  console.log("✅ Publishing crop:", crop);

  addCrop(crop);

  setShowCropForm(null);
  setNewCrop({
    name: "",
    price: 0,
    quantity: 0,
    description: "",
    category: "Vegetables",
    image:
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=400",
  });
};


  const calculateRating = (farmerId: string) => {
    const farmerTxs = transactions.filter(t => t.sellerId === farmerId);
    const orders = farmerTxs.length;
    return Math.min(5.0, 3.0 + (orders * 0.2)).toFixed(1);
  };

  const getTipIcon = (cat: string) => {
    switch (cat) {
      case 'Support': return '🤝';
      case 'Growth': return '🌱';
      case 'Technology': return '📱';
      case 'Logistics': return '🚛';
      default: return '💡';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-600 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-1">{t.myFarmers}</p>
          <p className="text-3xl font-black">{verifiedRegionalFarmers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Managed Stock</p>
          <p className="text-3xl font-black text-slate-800">{crops.filter(c => verifiedRegionalFarmers.some(f => f.id === c.farmerId)).length}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
          <p className="text-xl font-black text-emerald-600 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Agent Online
          </p>
        </div>
      </div>

      <div className="flex border-b overflow-x-auto scrollbar-hide gap-6">
        <button onClick={() => setActiveTab('verification')} className={`px-2 py-3 whitespace-nowrap border-b-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'verification' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>
          Identity & Crops {totalRequests > 0 && `(${totalRequests})`}
        </button>
        <button onClick={() => setActiveTab('farmers')} className={`px-2 py-3 whitespace-nowrap border-b-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'farmers' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>
          Manage Managed Farmers
        </button>
        <button onClick={() => setActiveTab('map')} className={`px-2 py-3 whitespace-nowrap border-b-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'map' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>
          Regional Radar
        </button>
        <button onClick={() => setActiveTab('strategy')} className={`px-2 py-3 whitespace-nowrap border-b-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'strategy' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>
          Strategy
        </button>
      </div>

      {activeTab === 'verification' && (
        <div className="space-y-10">
          <div className="bg-white p-6 rounded-[32px] border flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-800">Regional Enrollment</h3>
              <p className="text-xs text-slate-400">Help farmers without smartphones join the network.</p>
            </div>
            <button onClick={() => setShowRegForm(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100">+ Register Farmer</button>
          </div>

          <div className="space-y-6">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] text-slate-400">Farmer Verification Requests</h3>
            <div className="grid grid-cols-1 gap-4">
              {unverifiedRegionalUserRequests.map(farmer => (
                <div key={farmer.id} className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-left duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black">{farmer.name.charAt(0)}</div>
                    <div>
                      <p className="font-black text-slate-800">{farmer.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{farmer.location}</p>
                    </div>
                  </div>
                  <button onClick={() => onVerify(farmer.id)} className="w-full md:w-auto bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100">Verify Identity</button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] text-slate-400">Harvest Quality Checks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {regionalCropRequests.map(crop => {
                const farmer = users.find(u => u.id === crop.farmerId);
                return (
                  <div key={crop.id} className="bg-white p-6 rounded-[32px] border shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <img src={crop.image} className="w-16 h-16 rounded-2xl object-cover" />
                      <div>
                        <h4 className="font-black text-slate-800">{crop.name}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">By {farmer?.name} • {farmer?.location}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onVerifyCrop(crop.id)} 
                      className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
                    >
                      Approve Quality
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'farmers' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-2">My Managed Fleet</h3>
              <p className="text-slate-400 text-sm font-medium">You are the primary tech and logistics manager for these farmers.</p>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-3xl">👨‍👩‍👧‍👦</div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {verifiedRegionalFarmers.map(farmer => {
              const farmerCrops = crops.filter(c => c.farmerId === (farmer._id || farmer.id)
);
              const rating = calculateRating(farmer.id);
              return (
                <div key={farmer.id} className="bg-white p-8 rounded-[40px] border shadow-sm flex flex-col md:flex-row gap-8 group">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-emerald-50 rounded-[28px] flex items-center justify-center text-3xl font-black text-emerald-600 border border-emerald-100">
                       {farmer.name.charAt(0)}
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-1 bg-emerald-100 text-emerald-700 font-black text-[10px] px-2 py-1 rounded-lg">
                       ⭐ {rating}
                    </div>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h4 className="font-black text-xl text-slate-800">{farmer.name}</h4>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{farmer.phone} • {farmer.location}</p>
                      </div>
                      <button 
                        onClick={() => setShowCropForm(farmer)}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-50 active:scale-95 transition-all"
                      >
                        + List Harvest
                      </button>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Active Inventory Management</p>
                      <div className="flex flex-wrap gap-3">
                         {farmerCrops.map(c => (
                           <div key={c.id} className="bg-slate-50 border p-4 rounded-3xl flex items-center gap-4 hover:border-emerald-200 transition-all">
                              <img src={c.image} className="w-10 h-10 rounded-xl object-cover" />
                              <div>
                                <p className="text-xs font-black text-slate-800">{c.name}</p>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">{c.quantity} {c.unit} @ ₹{c.price}/kg</p>
                              </div>
                           </div>
                         ))}
                         {farmerCrops.length === 0 && (
                           <p className="text-xs text-slate-400 italic">No crops currently listed for this farmer.</p>
                         )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="bg-white rounded-[40px] border shadow-sm p-6 space-y-6 overflow-hidden min-h-[500px] flex flex-col">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-800 text-xl">Active Service Area</h3>
            <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Live 30km Tracker</span>
          </div>
          <div className="flex-1 bg-slate-50 rounded-[32px] border-4 border-white shadow-inner relative overflow-hidden flex items-center justify-center">
             <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce">📍</div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scan for farmers in {user.location}</p>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="bg-emerald-950 p-10 rounded-[40px] text-white relative overflow-hidden">
             <div className="relative z-10 max-w-lg">
                <h3 className="text-3xl font-black mb-4">Agent Intelligence</h3>
                <p className="text-emerald-100/60 font-medium mb-8">Personalized management tips for your specific region, powered by Gemini AI.</p>
                <button 
                  onClick={fetchStrategy}
                  disabled={tipsLoading}
                  className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50"
                >
                  {tipsLoading ? "Generating..." : "Fetch Regional Advice"}
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tips.map((tip, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[32px] border shadow-sm group hover:shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl">{getTipIcon(tip.category)}</div>
                   <div>
                     <h4 className="font-black text-slate-800 text-lg leading-tight">{tip.title}</h4>
                     <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{tip.category}</p>
                   </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{tip.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showRegForm && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <form className="bg-white p-10 rounded-[40px] w-full max-w-md space-y-6 shadow-2xl animate-in zoom-in duration-200" onSubmit={(e) => {
            e.preventDefault();
            onProxyRegister({...proxyData, id: `F-${Math.random().toString(36).substr(2, 6)}`, role: 'FARMER', verified: true, coords: { lat: 30.9, lng: 75.8 }});
            setShowRegForm(false);
          }}>
            <h3 className="text-2xl font-black text-slate-800 text-center">Enroll Farmer</h3>
            <div className="space-y-4">
              <input className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-bold outline-none" placeholder="Full Name" required onChange={e => setProxyData({...proxyData, name: e.target.value})}/>
              <input className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-bold outline-none" placeholder="Mobile Number" required onChange={e => setProxyData({...proxyData, phone: e.target.value})}/>
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowRegForm(false)} className="flex-1 py-4 border rounded-2xl font-bold text-slate-400">Cancel</button>
              <button type="submit" className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100">Register</button>
            </div>
          </form>
        </div>
      )}

      {showCropForm && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[50px] w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-slate-800">List Proxy Harvest</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Listing on behalf of: {showCropForm.name}</p>
              </div>
              <button onClick={() => setShowCropForm(null)} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-400">✕</button>
            </div>
            
            <form onSubmit={handleAddProxyCrop} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Crop Name</label>
                  <div className="flex gap-2">
                    <input className="flex-1 border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-bold outline-none focus:border-emerald-500 transition-all" value={newCrop.name} onChange={e => setNewCrop({...newCrop, name: e.target.value})} placeholder="e.g. Alphonso Mango" required />
                    <button type="button" onClick={handleAutoDesc} disabled={descLoading || !newCrop.name} className="px-5 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] hover:bg-emerald-100 transition-all">
                      {descLoading ? '...' : '✨ AI'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Price (₹/kg)</label>
                    <input type="number" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-bold outline-none" value={newCrop.price} onChange={e => setNewCrop({...newCrop, price: Number(e.target.value)})} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Quantity</label>
                    <input type="number" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-bold outline-none" value={newCrop.quantity} onChange={e => setNewCrop({...newCrop, quantity: Number(e.target.value)})} required />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Crop Details</label>
                  <textarea className="w-full h-32 border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-bold outline-none resize-none" value={newCrop.description} onChange={e => setNewCrop({...newCrop, description: e.target.value})} required />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100">Publish to Marketplace</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
