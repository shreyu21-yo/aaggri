import React, { useState, useRef } from 'react';
import { User, Crop, Transaction, TranslationSet, CropGuidelines, Language } from '../types';
import { generateCropDescription, getCropGuidelines } from '../services/gemini';
import { FarmingTips } from './FarmingTips';
import { CropDiagnostic } from './CropDiagnostic';

interface Props {
  user: User;
  onUpdateUser: (u: User) => void;
  crops: Crop[];
  users: User[]; 
  addCrop: (c: Crop) => void;
  transactions: Transaction[];
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onRequestCropVerification: (cropId: string) => void;
  t: TranslationSet;
  lang: Language;
}

export const FarmerView: React.FC<Props> = ({ user, onUpdateUser, crops, users, addCrop, transactions, onUpdateTransaction, onRequestCropVerification, t, lang }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'crops' | 'add' | 'payments' | 'tips' | 'orders'>('crops');
  const [newCrop, setNewCrop] = useState<Partial<Crop>>({ name: '', price: 0, quantity: '', description: '', category: 'Vegetable', portfolioUrl: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCropForGuide, setSelectedCropForGuide] = useState<Crop | null>(null);
  const [guideData, setGuideData] = useState<CropGuidelines | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const farmerCrops = crops.filter(c => c.farmerId === user._id);
  const farmerTransactions = transactions.filter(t => t.sellerId === user._id);
  
  const totalEarnings = farmerTransactions.filter(tx => tx.status === 'DISBURSED').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOrders = farmerTransactions.length;
  const rating = Math.min(5.0, 3.0 + (totalEarnings / 2000) * 0.1 + (totalOrders * 0.2)).toFixed(1);

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const desc = await generateCropDescription(newCrop.name || 'generic crop');
    const crop: Crop = {
  id: Math.random().toString(36).substr(2, 9),

  farmerId: user._id,
  farmerName: user.name,
  farmerPhone: user.phone,
  farmerLocation: user.location,

  name: newCrop.name || '',
  price: newCrop.price || 0,
  quantity: newCrop.quantity || '',
  description: desc || '',
  category: newCrop.category || 'Other',
  portfolioUrl: newCrop.portfolioUrl || '',
  image: imagePreview || '',

  verified: false,
  verificationRequested: false,
  isSold: false,
};


    addCrop(crop);
    setNewCrop({ name: '', price: 0, quantity: '', description: '', category: 'Vegetable', portfolioUrl: '' });
    setImagePreview(null);
    setActiveTab('crops');
    setLoading(false);
  };

  const handleRequestVerification = () => {
    onUpdateUser({ ...user, verificationRequested: true });
  };

  const handleUpdateStatus = (txId: string, nextStatus: Transaction['status']) => {
    if (onUpdateTransaction) {
      onUpdateTransaction(txId, { status: nextStatus });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ESCROW_PAID': return 'bg-blue-100 text-blue-700';
      case 'IN_TRANSIT': return 'bg-purple-100 text-purple-700';
      case 'DELIVERED': return 'bg-orange-100 text-orange-700';
      case 'DISBURSED': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showDiagnostic && <CropDiagnostic lang={lang} t={t} onClose={() => setShowDiagnostic(false)} />}
      
      {!user.verified && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white border-2 border-dashed border-emerald-100 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
             <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
             <div className="relative z-10 text-center md:text-left">
                <h3 className="text-xl font-black text-slate-800 mb-1">Regional Community Access</h3>
                <p className="text-sm text-slate-500 font-medium">Connect with a Community Member in <span className="text-emerald-600 font-bold">{user.location}</span> to verify your farm.</p>
             </div>
             <div className="relative z-10">
               {user.verificationRequested ? (
                 <div className="flex items-center gap-3 bg-orange-50 text-orange-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-orange-100">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    Pending Regional Approval
                 </div>
               ) : (
                 <button 
                  onClick={handleRequestVerification}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
                 >
                   Send Verification Request
                 </button>
               )}
             </div>
          </div>
        </div>
      )}

      <div className="flex border-b mb-8 overflow-x-auto scrollbar-hide gap-6">
        {[
          { id: 'crops', label: t.myCrops },
          { id: 'orders', label: 'Active Orders' },
          { id: 'add', label: t.sellNew },
          { id: 'payments', label: t.salesHistory },
          { id: 'tips', label: t.farmingTips },
          { id: 'profile', label: t.profile }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-2 py-3 capitalize whitespace-nowrap transition-all border-b-2 font-black text-xs uppercase tracking-widest ${activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'crops' && (
        <div className="space-y-6">
          <button 
            onClick={() => setShowDiagnostic(true)}
            className="w-full p-6 bg-emerald-600 text-white rounded-[32px] shadow-xl flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📸</div>
               <div className="text-left">
                  <h4 className="font-black text-lg">AI Crop Doctor</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Analyze plant health now</p>
               </div>
            </div>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {farmerCrops.map(crop => (
              <div key={crop.id} className={`bg-white rounded-[32px] border shadow-sm group overflow-hidden flex flex-col h-full ${crop.isSold ? 'opacity-75' : ''}`}>
                <div className="h-48 relative shrink-0">
                  <img src={crop.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  {crop.isSold && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">Sold Out</span>
                    </div>
                  )}
                  {crop.verified && (
                    <div className="absolute top-4 right-4 bg-emerald-600 text-white p-1 rounded-full shadow-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-slate-800 text-lg">{crop.name}</h4>
                    <span className="font-black text-emerald-600">₹{crop.price}/kg</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 italic">{crop.description}</p>
                  
                  <div className="mt-auto space-y-4">
                    {!crop.verified && (
                      <div className="pt-4 border-t">
                        {crop.verificationRequested ? (
                          <div className="text-center py-2 bg-orange-50 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
                            Verification Pending
                          </div>
                        ) : (
                          <button 
                            onClick={() => onRequestCropVerification(crop.id)}
                            className="w-full py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-emerald-100"
                          >
                            Request Verification
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.stock}: {crop.quantity}</span>
                      <button onClick={() => setSelectedCropForGuide(crop)} className="text-[10px] font-black uppercase text-emerald-600 tracking-widest hover:underline">View Guide</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {farmerTransactions.filter(tx => tx.status !== 'DISBURSED').length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[40px] border border-dashed">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active orders found</p>
            </div>
          ) : (
            farmerTransactions.filter(tx => tx.status !== 'DISBURSED').map(tx => {
              const buyer = users.find(u => u.id === tx.buyerId);
              const crop = crops.find(c => c.id === tx.cropId);
              return (
                <div key={tx.id} className="bg-white p-8 rounded-[40px] border shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={crop?.image} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg">{crop?.name}</h4>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Order ID: {tx.id}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-[24px] border flex flex-col items-center md:items-end">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payout</p>
                      <p className="text-2xl font-black text-emerald-600">₹{tx.amount}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vendor Information</h5>
                        {buyer?.phone && (
                          <button 
                            onClick={() => window.open(`tel:${buyer.phone}`)}
                            className="bg-emerald-600 text-white p-2 rounded-lg shadow-lg active:scale-90 transition-all"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.405 5.405l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black">👤</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{buyer?.name || "Unknown Vendor"}</p>
                          <p className="text-xs text-slate-500 font-mono">{buyer?.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black">📍</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Delivery Address</p>
                          <p className="text-xs text-slate-500">{tx.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Logistics Preference</h5>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${tx.deliveryMode === 'AGRICONNECT' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100'}`}>
                          {tx.deliveryMode === 'AGRICONNECT' ? '🚛' : '🚜'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">
                            {tx.deliveryMode === 'AGRICONNECT' ? 'AgriConnect Managed' : 'Vendor Self-Pickup'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">
                            {tx.deliveryMode === 'AGRICONNECT' ? 'Pickup will be scheduled' : 'Wait for vendor arrival'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-[32px] border">
                    <div className="flex justify-between items-center mb-6">
                      <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest ${getStatusColor(tx.status)}`}>
                        {tx.status.replace('_', ' ')}
                      </span>
                      {tx.status === 'ESCROW_PAID' && (
                        <button 
                          onClick={() => handleUpdateStatus(tx.id, 'IN_TRANSIT')}
                          className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100"
                        >
                          Mark as Shipped
                        </button>
                      )}
                    </div>
                    {/* Visual Progress bar */}
                    <div className="flex items-center gap-2">
                       <div className={`h-2 flex-1 rounded-full ${['ESCROW_PAID', 'IN_TRANSIT', 'DELIVERED', 'DISBURSED'].indexOf(tx.status) >= 0 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                       <div className={`h-2 flex-1 rounded-full ${['IN_TRANSIT', 'DELIVERED', 'DISBURSED'].indexOf(tx.status) >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                       <div className={`h-2 flex-1 rounded-full ${['DELIVERED', 'DISBURSED'].indexOf(tx.status) >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <form onSubmit={handleAddCrop} className="bg-white p-10 rounded-[40px] border shadow-sm space-y-8">
          <h3 className="text-2xl font-black text-slate-800">{t.sellNew}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">{t.cropName}</label>
                <input type="text" required placeholder="e.g. Basmati Rice" className="w-full border p-4 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={newCrop.name} onChange={e => setNewCrop({...newCrop, name: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">{t.pricePerKg}</label>
                  <input type="number" required className="w-full border p-4 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={newCrop.price} onChange={e => setNewCrop({...newCrop, price: Number(e.target.value)})}/>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">{t.quantityAvail}</label>
                  <input type="text" required placeholder="500kg" className="w-full border p-4 rounded-2xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" value={newCrop.quantity} onChange={e => setNewCrop({...newCrop, quantity: e.target.value})}/>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">{t.cropImage}</label>
              <div onClick={() => fileInputRef.current?.click()} className="h-56 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center bg-slate-50 cursor-pointer overflow-hidden group hover:border-emerald-400 transition-all">
                {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : (
                  <>
                    <span className="text-3xl mb-2 opacity-40">📸</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.uploadImage}</span>
                  </>
                )}
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setImagePreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}/>
              </div>
            </div>
          </div>
          <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 disabled:opacity-50 transition-all active:scale-95">
            {loading ? "Optimizing Please Wait..." : t.listCrop}
          </button>
        </form>
      )}

      {activeTab === 'tips' && <FarmingTips location={user.location || 'Punjab'} lang={lang} t={t} />}
      
      {activeTab === 'profile' && (
        <div className="bg-white p-10 rounded-[40px] border shadow-sm space-y-10">
          <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[32px]">
            <div>
              <h3 className="text-2xl font-black text-slate-800">{user.name}</h3>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{user.location}</p>
            </div>
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl flex flex-col items-center shadow-lg">
              <span className="text-[8px] font-black uppercase tracking-tighter opacity-80 mb-0.5">Trust Score</span>
              <span className="font-black text-xl leading-none">{rating}</span>
            </div>
          </div>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Payout Account</label><input className="w-full border p-4 rounded-2xl bg-slate-50 font-bold" defaultValue={user.bankAccount} /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">IFSC Code</label><input className="w-full border p-4 rounded-2xl bg-slate-50 font-bold uppercase" defaultValue={user.ifsc} /></div>
            </div>
            <button type="button" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-100">Save Configuration</button>
          </form>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden">
          <div className="p-8 border-b">
            <h3 className="text-xl font-black text-slate-800">Sales Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b">
                <tr>
                  <th className="p-6">Ordered Item</th>
                  <th className="p-6">Vendor</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {farmerTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6">
                      <p className="font-black text-slate-800">{crops.find(c => c.id === tx.cropId)?.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{tx.id}</p>
                    </td>
                    <td className="p-6 text-xs font-bold text-slate-500">{users.find(u => u.id === tx.buyerId)?.name}</td>
                    <td className="p-6">
                       <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusColor(tx.status)}`}>
                        {tx.status}
                       </span>
                    </td>
                    <td className="p-6 text-right font-black text-slate-800">₹{tx.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};