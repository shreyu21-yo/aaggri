import React, { useState, useEffect, useCallback } from 'react';
import { User, Crop, Transaction, TranslationSet, VendorTip } from '../types';
import { PaymentGateway } from './PaymentGateway';
import { askGemini } from "../services/gemini";
await askGemini(`Give vendor selling tips for farmers in ${location}`);

interface Props {
  user: User;
  crops: Crop[];
  users: User[];
  onPurchase: (tx: Transaction) => void;
  transactions: Transaction[];
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  t: TranslationSet;
}

export const VendorView: React.FC<Props> = ({ user, crops, users, onPurchase, transactions, onUpdateTransaction, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [view, setView] = useState<'market' | 'history' | 'strategy'>('market');
  const [selectedCropForPay, setSelectedCropForPay] = useState<Crop | null>(null);
  const [checkoutCrop, setCheckoutCrop] = useState<Crop | null>(null);
  const [selectedFarmerForContact, setSelectedFarmerForContact] = useState<User | null>(null);
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<'AGRICONNECT' | 'SELF_TRANSPORT'>('AGRICONNECT');
  
  const [tips, setTips] = useState<VendorTip[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);

  const fetchStrategy = useCallback(async () => {
    setTipsLoading(true);
    try {
      const data = await getVendorTips(user.location || "Punjab", 'en');
      setTips(data.tips || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTipsLoading(false);
    }
  }, [user.location]);

  useEffect(() => {
    if (view === 'strategy' && tips.length === 0) fetchStrategy();
  }, [view, tips.length, fetchStrategy]);

  const filteredCrops = crops.filter(crop => {
  const matchesCrop = crop.name
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  const matchesLocation =
    !locationSearch ||
    crop.farmerLocation
      ?.toLowerCase()
      .includes(locationSearch.toLowerCase());

  return matchesCrop && matchesLocation;
});



  const vendorTransactions = [...transactions].filter(t => t.buyerId === user._id).reverse();
  const totalSpent = vendorTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  const handleStartPayment = () => {
    setSelectedCropForPay(checkoutCrop);
    setCheckoutCrop(null);
  };

  const handlePaymentSuccess = () => {
    if (!selectedCropForPay) return;
    
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + (deliveryMode === 'AGRICONNECT' ? 3 : 1));
    
    const newTx: Transaction = {
      id: `TX-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      buyerId: user._id,
      sellerId: selectedCropForPay.farmerId,
      cropId: selectedCropForPay.id,
      amount: selectedCropForPay.price * 10 + (deliveryMode === 'AGRICONNECT' ? 150 : 0),
      status: 'ESCROW_PAID',
      deliveryMode: deliveryMode,
      deliveryAddress: user.location || "Default Delivery Point",
      estimatedArrival: arrivalDate.toISOString(),
      date: new Date().toISOString()
    };
    onPurchase(newTx);
    setReceipt(newTx);
    setSelectedCropForPay(null);
  };

  const handleMarkReceived = (txId: string) => {
    if (onUpdateTransaction) {
      onUpdateTransaction(txId, { status: 'DELIVERED' });
    }
  };

  const getTipIcon = (cat: string) => {
    switch (cat) {
      case 'Maintenance': return '🧊';
      case 'Selling': return '💰';
      case 'Logistics': return '🚛';
      case 'Quality': return '⭐';
      default: return '💡';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ESCROW_PAID': return 'bg-blue-100 text-blue-700';
      case 'IN_TRANSIT': return 'bg-purple-100 text-purple-700';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-700';
      case 'DISBURSED': return 'bg-emerald-600 text-white';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {selectedCropForPay && (
        <PaymentGateway 
          crop={selectedCropForPay} 
          t={t} 
          onSuccess={handlePaymentSuccess} 
          onCancel={() => setSelectedCropForPay(null)} 
        />
      )}

      {selectedFarmerForContact && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xs p-8 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-4 text-center">Contact Supplier</h3>
            <div className="bg-emerald-50 p-6 rounded-2xl text-center mb-6">
              <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Farmer Identity</p>
              <p className="text-lg font-bold text-slate-800 mb-1">{selectedFarmerForContact.name}</p>
              <p className="text-2xl font-black text-emerald-700 tracking-wider font-mono">{selectedFarmerForContact.phone}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => window.open(`tel:${selectedFarmerForContact.phone}`)} className="bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-xl shadow-emerald-100 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.405 5.405l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                Place Call
              </button>
              <button onClick={() => setSelectedFarmerForContact(null)} className="text-slate-400 font-bold py-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 className="text-2xl font-black mb-2">{t.paymentSuccess}</h3>
            <p className="text-xs text-slate-500 mb-8">Tracking ID: <span className="font-mono font-bold text-slate-800">{receipt.id}</span></p>
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 space-y-2 text-left">
               <div className="flex justify-between text-xs font-bold text-slate-400"><span>CROP</span><span>{crops.find(c => c.id === receipt.cropId)?.name}</span></div>
               <div className="flex justify-between text-xs font-bold text-slate-400"><span>DELIVERY</span><span>{receipt.deliveryMode === 'AGRICONNECT' ? t.deliveryByAgri : t.deliveryBySelf}</span></div>
               <div className="flex justify-between text-base font-black text-slate-800 pt-2 border-t mt-2"><span>TOTAL</span><span>₹{receipt.amount}</span></div>
            </div>
            <button onClick={() => {setReceipt(null); setView('history');}} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">{t.done}</button>
          </div>
        </div>
      )}

      {checkoutCrop && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-800 mb-2">{t.buyNow}</h3>
            <p className="text-xs text-slate-400 font-bold mb-8 uppercase tracking-widest">Select your transport preference</p>
            
            <div className="space-y-3 mb-10">
              <button 
                onClick={() => setDeliveryMode('AGRICONNECT')}
                className={`w-full p-5 rounded-3xl border-2 flex items-center justify-between transition-all ${deliveryMode === 'AGRICONNECT' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">🚛</div>
                  <div className="text-left">
                    <p className={`font-black text-sm ${deliveryMode === 'AGRICONNECT' ? 'text-emerald-700' : 'text-slate-700'}`}>{t.deliveryByAgri}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Platform managed + Tracking</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${deliveryMode === 'AGRICONNECT' ? 'border-emerald-600' : 'border-slate-200'}`}>
                  {deliveryMode === 'AGRICONNECT' && <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>}
                </div>
              </button>

              <button 
                onClick={() => setDeliveryMode('SELF_TRANSPORT')}
                className={`w-full p-5 rounded-3xl border-2 flex items-center justify-between transition-all ${deliveryMode === 'SELF_TRANSPORT' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl">🚜</div>
                  <div className="text-left">
                    <p className={`font-black text-sm ${deliveryMode === 'SELF_TRANSPORT' ? 'text-emerald-700' : 'text-slate-700'}`}>{t.deliveryBySelf}</p>
                    <p className="text-[10px] text-slate-400 font-bold">You manage pickup from farm</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${deliveryMode === 'SELF_TRANSPORT' ? 'border-emerald-600' : 'border-slate-200'}`}>
                  {deliveryMode === 'SELF_TRANSPORT' && <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>}
                </div>
              </button>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setCheckoutCrop(null)} className="flex-1 py-4 border rounded-2xl font-bold text-slate-400">Cancel</button>
              <button onClick={handleStartPayment} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100">Pay Securely</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-8 overflow-x-auto scrollbar-hide py-2">
        <button onClick={() => setView('market')} className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all ${view === 'market' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'bg-white text-slate-400 border'}`}>Marketplace</button>
        <button onClick={() => setView('history')} className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all ${view === 'history' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'bg-white text-slate-400 border'}`}>Orders</button>
        <button onClick={() => setView('strategy')} className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all ${view === 'strategy' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'bg-white text-slate-400 border'}`}>Strategy Center</button>
      </div>

      {view === 'market' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <input type="text" placeholder={t.searchCrops} className="p-4 border rounded-3xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-emerald-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <input type="text" placeholder={t.searchLocation} className="p-4 border rounded-3xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-emerald-500" value={locationSearch} onChange={e => setLocationSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredCrops.map(crop => {
              
              return (
                <div key={crop.id} className="bg-white rounded-[32px] overflow-hidden border shadow-sm group flex flex-col hover:-translate-y-2 transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img src={crop.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    {crop.isSold && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-red-600 text-white px-6 py-2 rounded-full font-black text-sm tracking-widest uppercase rotate-[-5deg] border-2 border-white/20">
                          {t.soldOut}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-[10px] font-black uppercase text-emerald-700">{crop.category}</div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-slate-800 text-lg">{crop.name}</h4>
                      <span className="text-emerald-600 font-black">₹{crop.price}/kg</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-4">
  Location: {crop.farmerLocation}
</p>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-6 flex-1">{crop.description}</p>
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <button
  onClick={() =>
    setSelectedFarmerForContact({
      name: crop.farmerName!,
      phone: crop.farmerPhone!,
    } as User)
  }
  className="border-2 border-slate-100 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
>
  Contact
</button>

                      <button 
                        disabled={crop.isSold} 
                        onClick={() => setCheckoutCrop(crop)} 
                        className={`py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all ${crop.isSold ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-emerald-100 active:scale-95'}`}
                      >
                        {crop.isSold ? "Out of Stock" : t.buyNow}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === 'strategy' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-black mb-2">Vendor Strategy Center</h2>
                <p className="text-slate-400 font-medium max-w-lg">Using AI to analyze market trends and crop longevity to help you maximize your margins.</p>
              </div>
              <button 
                onClick={fetchStrategy} 
                disabled={tipsLoading}
                className="bg-emerald-600 px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-900/40 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {tipsLoading ? "Analyzing..." : "Refresh Intelligence"}
              </button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full -mr-32 -mt-32"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tips.map((tip, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[32px] border shadow-sm group hover:shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{getTipIcon(tip.category)}</div>
                   <div>
                     <h4 className="font-black text-slate-800 text-lg">{tip.title}</h4>
                     <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{tip.category}</p>
                   </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{tip.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border shadow-sm p-8 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800">Order Manifest</h3>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Procurement</p>
              <p className="text-2xl font-black text-emerald-600">₹{totalSpent}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {vendorTransactions.map(tx => {
              const crop = crops.find(c => c.id === tx.cropId);

const farmer = crop
  ? {
      name: crop.farmerName,
      phone: crop.farmerPhone,
    }
  : null;

              const arrivalDate = tx.estimatedArrival ? new Date(tx.estimatedArrival) : null;
              
              return (
                <div key={tx.id} className="bg-white rounded-[40px] border shadow-sm p-8 hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={crop?.image} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg">{crop?.name}</h4>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Order: {tx.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</p>
                        <p className="text-2xl font-black text-emerald-600">₹{tx.amount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-t border-slate-50 pt-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Farmer Contact</h5>
                        {farmer?.phone && (
                          <button 
                            onClick={() => window.open(`tel:${farmer.phone}`)}
                            className="bg-emerald-600 text-white p-2 rounded-lg shadow-lg active:scale-90 transition-all"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.405 5.405l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-black">🚜</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{farmer?.name || "Farmer"}</p>
                          <p className="text-xs text-slate-500 font-mono">{farmer?.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Logistics</h5>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${tx.deliveryMode === 'AGRICONNECT' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100'}`}>
                          {tx.deliveryMode === 'AGRICONNECT' ? '🚛' : '🚜'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{tx.deliveryMode === 'AGRICONNECT' ? 'AgriConnect' : 'Self Pickup'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">
                            ETA: {arrivalDate && !isNaN(arrivalDate.getTime()) ? arrivalDate.toLocaleDateString() : "TBD"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-[32px] border ${tx.status === 'DELIVERED' || tx.status === 'DISBURSED' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest ${getStatusColor(tx.status)}`}>
                        {tx.status.replace('_', ' ')}
                      </span>
                      {tx.status === 'IN_TRANSIT' && (
                        <button 
                          onClick={() => handleMarkReceived(tx.id)}
                          className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100"
                        >
                          Mark as Received
                        </button>
                      )}
                    </div>
                    {/* Visual Progress bar */}
                    <div className="flex items-center gap-2">
                       <div className={`h-2.5 flex-1 rounded-full ${['ESCROW_PAID', 'IN_TRANSIT', 'DELIVERED', 'DISBURSED'].indexOf(tx.status) >= 0 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                       <div className={`h-2.5 flex-1 rounded-full ${['IN_TRANSIT', 'DELIVERED', 'DISBURSED'].indexOf(tx.status) >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                       <div className={`h-2.5 flex-1 rounded-full ${['DELIVERED', 'DISBURSED'].indexOf(tx.status) >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
