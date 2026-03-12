import { useState, useEffect } from 'react';
import { 
  List, Users, Car, BarChart3, LogOut, 
  ChevronRight, PlusCircle 
} from 'lucide-react';
import { db } from './lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// 引入功能組件
import Login from './components/Login';
import Garage from './components/Garage';
import LogForm from './components/LogForm';
import SimpleStats from './components/SimpleStats';
import UserAdmin from './components/UserAdmin';
import AdminVehicleManager from './components/AdminVehicleManager'; // 確保匯入此組件

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
    return <Login onLogin={(user: any) => {
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    }} />;
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
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      
      {/* 1. 左側導覽列 (Midnight Blue) */}
      <aside className="w-72 bg-[#0f172a] text-slate-300 flex flex-col sticky top-0 h-screen border-r border-slate-800 shrink-0">
        
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

        {/* 選單區域 */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <div className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Operations
          </div>
          
          <SideBtn 
            icon={<List size={18} />} 
            label="採樣組車輛清單" 
            active={activeTab === 'garage' || activeTab === 'filling-log'} 
            onClick={() => { setActiveTab('garage'); setSelectedVehicle(null); }} 
          />

          {isAdmin && (
            <>
              <div className="px-4 py-3 mt-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-t border-slate-800 pt-8">
                Administration
              </div>
              <SideBtn 
                icon={<PlusCircle size={18} />} 
                label="車輛資產管理" 
                active={activeTab === 'add-vehicle'} 
                onClick={() => { setActiveTab('add-vehicle'); setSelectedVehicle(null); }} 
              />
              <SideBtn 
                icon={<Users size={18} />} 
                label="人員權限管理" 
                active={activeTab === 'users'} 
                onClick={() => setActiveTab('users')} 
              />
              <SideBtn 
                icon={<BarChart3 size={18} />} 
                label="數據分析報告" 
                active={activeTab === 'stats'} 
                onClick={() => setActiveTab('stats')} 
              />
            </>
          )}
        </nav>

        {/* 底部帳號資訊 */}
        <div className="p-6 bg-[#0a101f] border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-white border border-slate-600 uppercase">
                {currentUser.name?.[0] || 'U'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200 truncate w-32">{currentUser.name}</p>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">{currentUser.role}</p>
              </div>
            </div>
            <button 
              onClick={() => { setCurrentUser(null); localStorage.removeItem('user'); }}
              className="text-slate-500 hover:text-rose-400 transition-colors p-2 hover:bg-slate-800 rounded-lg"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. 右側主內容區 */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>系統</span>
            <ChevronRight size={14} />
            <span className="text-slate-900 font-bold">
              {activeTab === 'garage' && '採樣組車輛清單'}
              {activeTab === 'add-vehicle' && '管理員：車輛資產管理'}
              {activeTab === 'filling-log' && `數據填報 - ${selectedVehicle?.name}`}
              {activeTab === 'users' && '人員權限管理'}
              {activeTab === 'stats' && '數據分析報告'}
            </span>
          </div>
        </header>

        <div className="p-10 max-w-5xl mx-auto">
          {/* A. 前台車輛清單 */}
          {activeTab === 'garage' && (
            <Garage 
              vehicles={vehicles} 
              isAdmin={false} 
              onSelectVehicle={handleSelectVehicle} 
            />
          )}

          {/* B. 管理員：車輛資產管理後台 (修正點) */}
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

// 側欄按鈕組件
function SideBtn({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm transition-all duration-200 group relative ${
        active 
        ? 'text-white bg-slate-800/50 shadow-inner' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
      }`}
    >
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
