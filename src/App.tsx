import { useState, useEffect } from 'react';
import { List, Gauge, Users, Car, BarChart3, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import { db } from './lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

import Login from './components/Login';
import Garage from './components/Garage';
import LogForm from './components/LogForm';
import SimpleStats from './components/SimpleStats';
import UserAdmin from './components/UserAdmin';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('garage');
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vehicles"), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  if (!currentUser) {
    return <Login onLogin={(user: any) => {
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    }} />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      
      {/* 1. 專業風左側導覽 (Midnight Blue) */}
      <aside className="w-72 bg-[#0f172a] text-slate-300 flex flex-col sticky top-0 h-screen border-r border-slate-800">
        
        {/* Logo 區塊 */}
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Car className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none tracking-tight">SAMPLING</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Vehicle Control</p>
            </div>
          </div>
        </div>

        {/* 功能選單 */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <div className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Operations
          </div>
          <SideBtn icon={<List size={18} />} label="車庫資產概覽" active={activeTab === 'garage'} onClick={() => setActiveTab('garage')} />
          <SideBtn icon={<Gauge size={18} />} label="里程數據填報" active={activeTab === 'log'} onClick={() => setActiveTab('log')} />

          {isAdmin && (
            <>
              <div className="px-4 py-3 mt-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-t border-slate-800 pt-8">
                Administration
              </div>
              <SideBtn icon={<Users size={18} />} label="人員權限管理" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
              <SideBtn icon={<BarChart3 size={18} />} label="數據分析報告" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
            </>
          )}
        </nav>

        {/* 底部帳號資訊 */}
        <div className="p-6 bg-[#0a101f] border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-white border border-slate-600">
                {currentUser.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">{currentUser.name}</p>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{currentUser.role}</p>
              </div>
            </div>
            <button 
              onClick={() => { setCurrentUser(null); localStorage.removeItem('user'); }}
              className="text-slate-500 hover:text-rose-400 transition-colors"
              title="登出系統"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. 主內容區 */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>系統</span>
            <ChevronRight size={14} />
            <span className="text-slate-900 font-bold">
              {activeTab === 'garage' && '車庫資產概覽'}
              {activeTab === 'log' && '里程數據填報'}
              {activeTab === 'users' && '人員權限管理'}
              {activeTab === 'stats' && '數據分析報告'}
            </span>
          </div>
          <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            v2.4.0 STABLE
          </div>
        </header>

        {/* 實際內容 */}
        <div className="p-10 max-w-5xl mx-auto">
          {activeTab === 'garage' && <Garage vehicles={vehicles} isAdmin={isAdmin} />}
          {activeTab === 'log' && <LogForm vehicles={vehicles} user={currentUser} onSuccess={() => setActiveTab('garage')} />}
          {activeTab === 'stats' && isAdmin && <SimpleStats vehicles={vehicles} />}
          {activeTab === 'users' && isAdmin && <UserAdmin />}
        </div>
      </main>
    </div>
  );
}

// 專業風按鈕組件
function SideBtn({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-200 group relative ${
        active 
        ? 'text-white bg-slate-800/50 shadow-inner' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
      }`}
    >
      {/* 側邊指示條 */}
      {active && (
        <div className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
      )}
      
      <div className={`transition-colors ${active ? 'text-emerald-500' : 'group-hover:text-slate-200'}`}>
        {icon}
      </div>
      <span className={active ? 'font-bold' : 'font-medium'}>{label}</span>
    </button>
  );
}
