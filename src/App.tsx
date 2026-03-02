import { useState, useEffect } from 'react';
import { 
  Calendar, Car, BarChart3, Settings, PlusCircle, 
  Menu, ChevronLeft, Bell, Search, User, LogOut
} from 'lucide-react';
import { db } from './lib/firebase';
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

// 引入我們即將建立的分頁元件
// import Dashboard from './pages/Dashboard';
// ... 

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 目前分頁
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* 左側側欄 Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Car size={24} />
          </div>
          {sidebarOpen && <span className="font-bold text-lg tracking-tight">採樣車輛管理</span>}
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-2">
          <NavItem 
            icon={<Calendar size={20} />} 
            label="行程月曆" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            expanded={sidebarOpen}
          />
          <div className="py-2 px-4 text-xs font-semibold text-slate-500 uppercase">快速操作</div>
          <NavItem 
            icon={<PlusCircle size={20} className="text-emerald-400" />} 
            label="新增行程" 
            active={activeTab === 'add-itinerary'} 
            onClick={() => setActiveTab('add-itinerary')} 
            expanded={sidebarOpen}
          />
          <NavItem 
            icon={<PlusCircle size={20} className="text-sky-400" />} 
            label="新增車輛" 
            active={activeTab === 'add-vehicle'} 
            onClick={() => setActiveTab('add-vehicle')} 
            expanded={sidebarOpen}
          />
          <div className="py-2 px-4 text-xs font-semibold text-slate-500 uppercase">分析與設定</div>
          <NavItem 
            icon={<BarChart3 size={20} />} 
            label="統計分析" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
            expanded={sidebarOpen}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="系統設定" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            expanded={sidebarOpen}
          />
        </nav>
        
        {/* 使用者資訊 */}
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 hover:bg-slate-800 w-full p-2 rounded-lg transition-colors text-slate-400">
            <LogOut size={20} />
            {sidebarOpen && <span>登出</span>}
          </button>
        </div>
      </aside>

      {/* 右側主內容區 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-md">
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-semibold text-slate-800">
              {activeTab === 'dashboard' && '行程概覽'}
              {activeTab === 'add-itinerary' && '新增車輛行程'}
              {activeTab === 'add-vehicle' && '車輛基本資料'}
              {activeTab === 'analytics' && '數據統計分析'}
              {activeTab === 'settings' && '系統設定中心'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜尋行程、車牌..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 ring-indigo-500 outline-none"
              />
            </div>
            <button className="relative text-slate-500 p-2">
              <Bell size={20} />
              <span className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right">
                <p className="text-sm font-medium">王小明</p>
                <p className="text-xs text-slate-500">系統管理員</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                王
              </div>
            </div>
          </div>
        </header>

        {/* 內容切換區 */}
        <section className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {/* 這裡之後會放各個分頁元件 */}
              {activeTab === 'dashboard' && <Placeholder label="月曆視圖 (開發中)" />}
              {activeTab === 'add-itinerary' && <Placeholder label="新增行程表單 (開發中)" />}
              {activeTab === 'add-vehicle' && <Placeholder label="車輛管理頁面 (開發中)" />}
              {activeTab === 'analytics' && <Placeholder label="統計圖表頁面 (開發中)" />}
              {activeTab === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

// 導航按鈕元件
function NavItem({ icon, label, active, onClick, expanded }: any) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl transition-all
        ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
      `}
    >
      <div className={`${active ? 'text-white' : 'text-slate-400'}`}>
        {icon}
      </div>
      {expanded && <span className="font-medium">{label}</span>}
      {active && expanded && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
    </button>
  );
}

function Placeholder({ label }: any) {
  return (
    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center text-slate-400">
      <Car size={64} className="mb-4 opacity-10" />
      <p className="text-lg font-medium">{label}</p>
    </div>
  );
}

// 4. 設定頁面的初步設計
function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState('system');

  const tabs = [
    { id: 'system', label: '系統設定', desc: '預設視圖與通知方式' },
    { id: 'vehicle', label: '車輛字典', desc: '顏色對應與狀態定義' },
    { id: 'auth', label: '權限控管', desc: '角色與人員訪問權限' },
    { id: 'data', label: '資料管理', desc: '匯出與操作紀錄' },
  ];

  return (
    <div className="flex gap-8">
      {/* 設定頁左側選單 */}
      <div className="w-64 space-y-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`w-full text-left p-4 rounded-2xl transition-all ${
              activeSubTab === tab.id ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-slate-200/50'
            }`}
          >
            <p className={`font-bold ${activeSubTab === tab.id ? 'text-indigo-600' : 'text-slate-700'}`}>{tab.label}</p>
            <p className="text-xs text-slate-500 mt-1">{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* 設定頁右側內容 */}
      <div className="flex-1 bg-white rounded-3xl border shadow-sm p-8">
        {activeSubTab === 'system' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b pb-4">系統顯示設定</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">預設視圖</label>
                <select className="w-full border p-2 rounded-lg bg-slate-50">
                  <option>月視圖 (Month View)</option>
                  <option>週視圖 (Week View)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">時段格式</label>
                <select className="w-full border p-2 rounded-lg bg-slate-50">
                  <option>24 小時制</option>
                  <option>12 小時制 (AM/PM)</option>
                </select>
              </div>
            </div>
            <div className="pt-4">
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">儲存所有設定</button>
            </div>
          </div>
        )}
        {/* 其他分頁以此類推... */}
      </div>
    </div>
  );
}
