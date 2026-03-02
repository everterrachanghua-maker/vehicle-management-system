import { useState } from 'react';
import { 
  Calendar, Car, BarChart3, Settings, PlusCircle, 
  Menu, Bell, Search, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// 假設的分頁元件（稍後我們會逐一實作）
import CalendarView from './components/CalendarView';
import ItineraryForm from './components/ItineraryForm';
import VehicleManager from './components/VehicleManager';
import AnalyticsView from './components/AnalyticsView';
import SettingsPage from './components/SettingsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* 1. 左側側欄 Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col z-20`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Car size={24} className="text-white" />
          </div>
          {sidebarOpen && <span className="font-bold text-lg tracking-tight whitespace-nowrap">採樣車輛管理</span>}
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto">
          <NavItem 
            icon={<Calendar size={20} />} 
            label="行程月曆" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            expanded={sidebarOpen}
          />
          <div className={`py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? '快速操作' : '•••'}
          </div>
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
          <div className={`py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? '分析與設定' : '•••'}
          </div>
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

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 hover:bg-red-500/10 hover:text-red-400 w-full p-3 rounded-xl transition-all text-slate-400">
            <LogOut size={20} />
            {sidebarOpen && <span className="font-medium">系統登出</span>}
          </button>
        </div>
      </aside>

      {/* 2. 右側主內容區 */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div>
                <h2 className="text-xl font-bold text-slate-800">
                {activeTab === 'dashboard' && '行程概覽 Dashboard'}
                {activeTab === 'add-itinerary' && '新增行程 Itinerary'}
                {activeTab === 'add-vehicle' && '車輛管理 Vehicles'}
                {activeTab === 'analytics' && '統計分析 Analytics'}
                {activeTab === 'settings' && '系統設定 Settings'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">Sampling Group Management System v2.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜尋行程、車牌、專案..." 
                className="pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl text-sm w-72 focus:ring-2 ring-indigo-500 transition-all outline-none"
              />
            </div>
            <button className="relative text-slate-500 p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 bg-red-500 w-2 h-2 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-700">浩廷環境</p>
                <p className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase">Admin</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl rotate-3 flex items-center justify-center text-white font-bold shadow-lg">
                浩
              </div>
            </div>
          </div>
        </header>

        {/* 3. 內容切換區 */}
        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <CalendarView />}
              {activeTab === 'add-itinerary' && <ItineraryForm onBack={() => setActiveTab('dashboard')} />}
              {activeTab === 'add-vehicle' && <VehicleManager />}
              {activeTab === 'analytics' && <AnalyticsView />}
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
        w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-200 group
        ${active 
          ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 font-bold' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
      `}
    >
      <div className={`${active ? 'text-white' : 'group-hover:text-white transition-colors'}`}>
        {icon}
      </div>
      {expanded && <span className="text-sm">{label}</span>}
      {active && expanded && (
        <motion.div layoutId="nav-dot" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
      )}
    </button>
  );
}
