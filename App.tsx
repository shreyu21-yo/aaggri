import React, { useState, useEffect } from 'react';
import { Splash } from './components/Splash';
import { Auth } from './components/Auth';
import { ProfileSetup } from './components/ProfileSetup';
import { FarmerView } from './components/FarmerView';
import { VendorView } from './components/VendorView';
import { CommunityView } from './components/CommunityView';
import { LanguageSelector } from './components/LanguageSelector';
import { InstallPrompt } from './components/InstallPrompt';
import { GeminiAssistant } from './components/GeminiAssistant';
import { TRANSLATIONS } from './constants';
import { User, Role, Crop, Transaction, Language } from './types';
import { signupUser, loginUser, updateUserRole } from "./services/auth";


const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [lang, setLang] = useState<Language>('en');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('agri_users');
    return saved ? JSON.parse(saved) : [
      { id: 'f1', name: 'Ramesh Singh', phone: '9876543210', password: 'password123', role: 'FARMER', verified: true, location: 'Punjab' }
    ];
  });
  
  const [crops, setCrops] = useState<Crop[]>(() => {
    const saved = localStorage.getItem('agri_crops');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('agri_txs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => localStorage.setItem('agri_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('agri_crops', JSON.stringify(crops)), [crops]);
  useEffect(() => localStorage.setItem('agri_txs', JSON.stringify(transactions)), [transactions]);

  const t = TRANSLATIONS[lang];

  const handleAuth = async ({
  name,
  phone,
  password,
  isRegister,
}: {
  name: string;
  phone: string;
  password: string;
  isRegister: boolean;
}) => {
  try {
    let response;

    if (isRegister) {
      response = await signupUser({ name, phone, password });
    } else {
      response = await loginUser({ phone, password });
    }

    if (!response || response.error || !response.user) {
      return response?.message || "Authentication failed";
    }

    setCurrentUser(response.user);
    setIsLoggedIn(true);

    // 👇 role selection comes first
    setNeedsProfileSetup(false);

    return null;
  } catch (err) {
    return "Server error. Please try again.";
  }
};


  const handleRoleSelect = async (role: Role) => {
  if (!currentUser) return;

  const response = await updateUserRole({
    userId: currentUser._id,
    role,
  });

  if (response.user) {
    setCurrentUser(response.user);

    // profile setup only if location missing
    setNeedsProfileSetup(!response.user.location);
  }
};


  const handleProfileComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setNeedsProfileSetup(false);
  };

  const handlePurchase = (tx: Transaction) => {
    setTransactions(prev => [...prev, tx]);
    setCrops(prev => prev.map(c => c.id === tx.cropId ? { ...c, isSold: true } : c));
  };

  const handleUpdateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const updated = prev.map(tx => {
        if (tx.id === id) {
          const newTx = { ...tx, ...updates };
          // PLATFORM AUTOMATION: If status becomes DELIVERED, automatically move to DISBURSED after 2 seconds
          if (updates.status === 'DELIVERED') {
            setTimeout(() => {
               setTransactions(current => current.map(ctx => ctx.id === id ? { ...ctx, status: 'DISBURSED' } : ctx));
            }, 3000);
          }
          return newTx;
        }
        return tx;
      });
      return updated;
    });
  };

  const handleRequestCropVerification = (cropId: string) => {
    setCrops(prev => prev.map(c => c.id === cropId ? { ...c, verificationRequested: true } : c));
  };

  const handleVerifyCrop = (cropId: string) => {
    setCrops(prev => prev.map(c => c.id === cropId ? { ...c, verified: true, verificationRequested: false } : c));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setShowLogoutConfirm(false);
  };

  if (showSplash) return <Splash onFinish={() => setShowSplash(false)} />;
  
  if (!isLoggedIn) return <Auth onAuth={handleAuth} lang={lang} t={t} setLang={setLang} />;

  return (
    <div className="min-h-screen bg-slate-50 font-inter select-none">
      <InstallPrompt />
      <GeminiAssistant lang={lang} t={t} location={currentUser?.location} />
      
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-8 w-full max-sm shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-2">{t.logout}</h3>
            <p className="text-slate-500 mb-8">{t.logoutConfirm}</p>
            <div className="flex gap-4">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 border rounded-2xl font-bold text-slate-400">{t.cancel}</button>
              <button onClick={handleLogout} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold shadow-xl shadow-red-100">{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {!currentUser?.role ? (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 safe-top">
          <div className="bg-white w-full max-w-3xl p-10 md:p-14 rounded-[50px] shadow-2xl border border-slate-50">
            <h2 className="text-4xl font-black text-center mb-3 text-slate-800">{t.selectRole}</h2>
            <p className="text-center text-slate-400 font-bold mb-14 tracking-wide uppercase text-[10px]">{t.chooseRoleDesc}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { role: 'FARMER', icon: '🌱', title: t.farmer, desc: t.farmerDesc },
                { role: 'VENDOR', icon: '🛒', title: t.vendor, desc: t.vendorDesc },
                { role: 'COMMUNITY', icon: '🤝', title: t.community, desc: t.communityDesc }
              ].map((item) => (
                <button 
                  key={item.role} 
                  onClick={() => handleRoleSelect(item.role as Role)} 
                  className="flex flex-col items-center p-8 border-2 border-slate-50 rounded-[32px] hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
                >
                  <span className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-500">{item.icon}</span>
                  <span className="font-black text-xl mb-3 text-slate-800">{item.title}</span>
                  <p className="text-[11px] text-center text-slate-400 font-bold px-2">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : needsProfileSetup ? (
        <ProfileSetup user={currentUser} onComplete={handleProfileComplete} t={t} />
      ) : (
        <>
          <header className="bg-emerald-600 text-white py-5 px-6 sticky top-0 z-40 shadow-xl safe-top">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
                </div>
                <h1 className="text-xl font-black uppercase tracking-tighter">AgriConnect</h1>
              </div>
              <button onClick={() => setShowLogoutConfirm(true)} className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/20">{t.logout}</button>
            </div>
          </header>
          <main className="py-10 max-w-7xl mx-auto px-4">
             <div className="flex justify-center mb-10">
               <LanguageSelector currentLang={lang} onSelect={setLang} />
             </div>
             {currentUser.role === 'FARMER' && (
               <FarmerView 
                user={currentUser} 
                onUpdateUser={setCurrentUser} 
                crops={crops} 
                users={users}
                addCrop={(c) => setCrops([...crops, c])} 
                transactions={transactions} 
                onUpdateTransaction={handleUpdateTransaction}
                onRequestCropVerification={handleRequestCropVerification}
                t={t} 
                lang={lang} 
               />
             )}
             {currentUser.role === 'VENDOR' && (
               <VendorView 
                user={currentUser} 
                crops={crops} 
                users={users} 
                onPurchase={handlePurchase} 
                onUpdateTransaction={handleUpdateTransaction}
                transactions={transactions} 
                t={t} 
               />
             )}
             {currentUser.role === 'COMMUNITY' && (
  <CommunityView 
    user={currentUser}
    users={users}
    crops={crops}
    transactions={transactions}
    onVerify={(id) =>
      setUsers(users.map(u => u.id === id ? { ...u, verified: true } : u))
    }
    onProxyRegister={(u) => setUsers([...users, u as User])}
    onUpdateTransaction={handleUpdateTransaction}
    onVerifyCrop={handleVerifyCrop}
    addCrop={(crop: Crop) => {
      setCrops(prev => [...prev, crop]);
    }}
    t={t}
    lang={lang}
  />
)}

          </main>
        </>
      )}
    </div>
  );
};

export default App;