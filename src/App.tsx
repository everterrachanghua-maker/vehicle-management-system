import { useState, useEffect } from 'react';
import { 
  List, Users, Car, BarChart3, LogOut, 
  ChevronRight, ShieldCheck, Settings 
} from 'lucide-react';
import { db } from './lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// 引入功能組件
import Login from './components/Login';
import Garage from './components/Garage';
import LogForm from './components/LogForm';
import SimpleStats from './components/SimpleStats';
import UserAdmin from './components/UserAdmin';
import AdminVehicleManager from './components/AdminVehicleManager';

export default function App() {
  // --- 狀態管理 ---
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const [activeTab, setActiveTab] = useState('garage'); 
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null); 
  const [vehicles, setVehicles] = useState<any[]>([]); 

  // 1. 初始化檢查登入狀態
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  // 2. 實時監聽資料庫車輛變動
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vehicles"), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // --- 權限判斷 ---
  const isAdmin = currentUser?.role === 'admin';

  // --- 登入介面攔截 ---
  if (!currentUser) {
    return (
      <Login onLogin={(user: any) => {
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      }} />
    );
  }

  // --- 處理功能邏輯 ---
  const handleSelectVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setActiveTab('filling-log'); 
  };

  const handleFinishLog = () => {
    setSelectedVehicle(null);
    setActiveTab('garage');
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] font-sans text-slate-900 selection:bg-emerald-100">
      
      {/* 1. 左側高級感導覽列 (Midnight Blue) */}
      <aside className="w-72 bg-[#0F172A] text-slate-300 flex flex-col sticky top-0 h-screen border-r border-slate-800 shrink-0 shadow-2xl">
        
        {/* Logo 區塊 */}
        <div className="p-10">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
              <Car className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight leading-none">SAMPLING</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5">Control Panel</p>
            </div>
          </div>
        </div>

        {/* 選單區域 */}
        <nav className="flex-1 px-6 space-y-1.5">
          <p className="px-4 py-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Operations</p>
          
          <SideBtn 
            icon={<List size={20} />} 
            label="採樣組車輛清單" 
            active={activeTab === 'garage' || activeTab === 'filling-log'} 
            onClick={() => { setActiveTab('garage'); setSelectedVehicle(null); }} 
          />

          {isAdmin && (
            <div className="mt-10 space-y-1.5">
              <p className="px-4 py-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] border-t border-slate-800/50 pt-8">Administrator</p>
              <SideBtn 
                icon={<ShieldCheck size={20} />} 
                label="車輛資產管理" 
                active={activeTab === 'add-vehicle'} 
                onClick={() => { setActiveTab('add-vehicle'); setSelectedVehicle(null); }} 
              />
              <SideBtn 
                icon={<Users size={20} />} 
                label="人員權限管理" 
                active={activeTab === 'users'} 
                onClick={() => setActiveTab('users')} 
              />
              <SideBtn 
                icon={<BarChart3 size={20} />} 
                label="數據分析報告" 
                active={activeTab === 'stats'} 
                onClick={() => setActiveTab('stats')} 
              />
            </div>
          )}
        </nav>

        {/* 底部帳號資訊與登出 */}
        <div className="m-6 p-4 bg-slate-900/50 rounded-3xl border border-slate-800/50 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-sm font-black text-emerald-400 border border-slate-700">
                {currentUser.name?.[0] || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate w-24">{currentUser.name}</p>
                <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-widest">{currentUser.role}</p>
              </div>
            </div>
            <button 
              onClick={() => { setCurrentUser(null); localStorage.removeItem('user'); }}
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
              title="登出系統"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. 右側主內容區 */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-12 sticky top-0 z-20">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-400 font-medium">系統控制台</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-900 font-bold tracking-tight">
              {activeTab === 'garage' && '採樣組車輛清單'}
              {activeTab === 'add-vehicle' && '管理員：車輛資產管理'}
              {activeTab === 'filling-log' && `數據填報 / ${selectedVehicle?.name}`}
              {activeTab === 'users' && '人員權限管理'}
              {activeTab === 'stats' && '數據分析報告'}
            </span>
          </div>
        </header>

        {/* 內容顯示區 */}
        <div className="p-12 max-w-6xl mx-auto w-full">
          
          {/* A. 前台：車輛清單 */}
          {activeTab === 'garage' && (
            <Garage 
              vehicles={vehicles} 
              isAdmin={false} 
              onSelectVehicle={handleSelectVehicle} 
            />
          )}

          {/* B. 管理員：車輛資產後台 (整合後的核心) */}
          {activeTab === 'add-vehicle' && isAdmin && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AdminVehicleManager />
            </div>
          )}

          {/* C. 里程填報表單 */}
          {activeTab === 'filling-log' && selectedVehicle && (
            <LogForm 
              vehicle={selectedVehicle} 
              user={currentUser} 
              onSuccess={handleFinishLog}
              onCancel={() => setActiveTab('garage')}
            />
          )}

          {/* D. 數據統計報告 */}
          {activeTab === 'stats' && isAdmin && (
            <SimpleStats vehicles={vehicles} />
          )}

          {/* E. 人員權限管理 */}
          {activeTab === 'users' && isAdmin && (
            <UserAdmin />
          )}
        </div>
      </main>
    </div>
  );
}

// 內部子組件：更精緻的側欄按鈕
function SideBtn({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm transition-all duration-300 group relative ${
        active 
        ? 'text-white bg-emerald-500/10 shadow-inner' 
        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      {active && (
        <div className="absolute left-0 w-1.5 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
      )}
      <div className={`transition-colors ${active ? 'text-emerald-500' : 'group-hover:text-emerald-400'}`}>
        {icon}
      </div>
      <span className={active ? 'font-bold tracking-tight' : 'font-medium'}>{label}</span>
    </button>
  );
}
