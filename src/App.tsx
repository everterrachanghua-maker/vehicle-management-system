import { useState, useEffect } from 'react';
import { List, Gauge, Users, Car, BarChart3, LogOut, ChevronLeft } from 'lucide-react';
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
    <div className="flex min-h-screen bg-slate-100 font-sans">
      
      {/* 1. 左側主內容區 */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'garage' && <Garage vehicles={vehicles} isAdmin={isAdmin} />}
          {activeTab === 'log' && <LogForm vehicles={vehicles} user={currentUser} onSuccess={() => setActiveTab('garage')} />}
          {activeTab === 'stats' && isAdmin && <SimpleStats vehicles={vehicles} />}
          {activeTab === 'users' && isAdmin && <UserAdmin />}
        </div>
      </main>

      {/* 2. 右側導覽選單 (深色主題) */}
      <aside className="w-64 bg-[#1a2234] text-slate-300 flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700/50">
          <h1 className="text-white font-black italic text-lg flex items-center gap-2">
            <Car className="text-indigo-400" /> SAMPLING VMS
          </h1>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">採樣組車輛管理系統</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 px-4 py-2 uppercase">通用功能</p>
          <SideBtn icon={<List size={18} />} label="車庫概覽" active={activeTab === 'garage'} onClick={() => setActiveTab('garage')} />
          <SideBtn icon={<Gauge size={18} />} label="車輛里程填報" active={activeTab === 'log'} onClick={() => setActiveTab('log')} />

          {isAdmin && (
            <>
              <p className="text-[10px] font-bold text-slate-500 px-4 py-6 uppercase">系統管理 (需驗證)</p>
              <SideBtn icon={<Users size={18} />} label="人員管理" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
              <SideBtn icon={<Car size={18} />} label="車輛管理" active={activeTab === 'garage'} onClick={() => setActiveTab('garage')} />
              <SideBtn icon={<BarChart3 size={18} />} label="數據統計匯總" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
            </>
          )}
        </nav>

        {/* 使用者資訊與登出 */}
        <div className="p-4 bg-[#151b2a] border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-4 py-2 mb-4">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
              {currentUser.name[0]}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 uppercase">{currentUser.role}</p>
            </div>
          </div>
          <button 
            onClick={() => { setCurrentUser(null); localStorage.removeItem('user'); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <LogOut size={16} /> 登出系統
          </button>
        </div>
      </aside>
    </div>
  );
}

// 右側選單按鈕組件
function SideBtn({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
        : 'hover:bg-slate-700/30 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
