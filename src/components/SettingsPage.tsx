import { useState } from 'react';
import { 
  Settings, Car, ShieldCheck, Database, 
  Bell, Palette, Clock, Save, 
  Trash2, FileDown, CheckCircle, AlertCircle, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState('system');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const triggerSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const tabs = [
    { id: 'system', label: '系統設定', desc: '預設視圖與時段格式', icon: <Settings size={18}/> },
    { id: 'vehicle', label: '車輛規則', desc: '狀態顏色與保養門檻', icon: <Palette size={18}/> },
    { id: 'auth', label: '權限控管', desc: '角色與人員訪問權限', icon: <ShieldCheck size={18}/> },
    { id: 'data', label: '資料管理', desc: '匯出與操作紀錄', icon: <Database size={18}/> },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* 1. 設定頁左側次導航 */}
      <div className="w-full lg:w-72 space-y-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`w-full text-left p-4 rounded-3xl transition-all flex gap-4 items-center border ${
              activeSubTab === tab.id 
              ? 'bg-white shadow-md border-indigo-100' 
              : 'hover:bg-slate-200/50 border-transparent text-slate-500'
            }`}
          >
            <div className={`p-2 rounded-xl ${activeSubTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {tab.icon}
            </div>
            <div>
              <p className={`font-bold text-sm ${activeSubTab === tab.id ? 'text-indigo-600' : 'text-slate-700'}`}>{tab.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">{tab.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* 2. 設定頁右側主內容 */}
      <div className="flex-1 bg-white rounded-[40px] border shadow-sm flex flex-col overflow-hidden relative">
        <div className="p-8 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeSubTab === 'system' && <SystemSettings />}
              {activeSubTab === 'vehicle' && <VehicleSettings />}
              {activeSubTab === 'auth' && <AuthSettings />}
              {activeSubTab === 'data' && <DataManagement />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 底部儲存列 */}
        <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-600 text-sm font-bold flex items-center gap-1">
                <CheckCircle size={16}/> 設定已成功儲存
              </motion.span>
            )}
          </div>
          <button 
            onClick={triggerSave}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Save size={18}/> 儲存變更
          </button>
        </div>
      </div>
    </div>
  );
}

// 分頁組件 (A): 系統設定
function SystemSettings() {
  return (
    <div className="space-y-8">
      <SectionTitle title="介面與時間顯示" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SettingItem label="預設視圖 (Dashboard)" desc="進入系統後首頁顯示的模式">
          <select className="input-field-sm">
            <option>月視圖 (Month View)</option>
            <option>週視圖 (Week View)</option>
            <option>日行程清單</option>
          </select>
        </SettingItem>
        <SettingItem label="時間格式" desc="行程表單中的顯示方式">
          <select className="input-field-sm">
            <option>24 小時制 (08:00 - 17:00)</option>
            <option>12 小時制 (AM/PM)</option>
          </select>
        </SettingItem>
      </div>

      <SectionTitle title="自動通知方式" />
      <div className="space-y-4">
        <CheckboxItem label="系統站內通知" desc="於右上方鈴鐺處顯示衝突與保養提醒" checked />
        <CheckboxItem label="LINE Notify 連動" desc="當行程有衝突或更動時，發送訊息至採樣組群組" />
        <CheckboxItem label="電子郵件提醒" desc="每日晨間發送今日車輛行程總表" />
      </div>
    </div>
  );
}

// 分頁組件 (B): 車輛字典設定
function VehicleSettings() {
  return (
    <div className="space-y-8">
      <SectionTitle title="保養門檻提醒" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <SettingItem label="保養預警公里數" desc="距離下次保養剩餘多少公里時開始警示">
          <input type="number" defaultValue={500} className="input-field-sm" />
        </SettingItem>
        <SettingItem label="保險到期提醒" desc="到期前多少天顯示於統計頁面">
          <input type="number" defaultValue={30} className="input-field-sm" />
        </SettingItem>
      </div>

      <SectionTitle title="行程顏色規則" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ColorLabel color="#6366f1" label="已排程 (Scheduled)" />
        <ColorLabel color="#10b981" label="進行中 (Ongoing)" />
        <ColorLabel color="#f59e0b" label="保養中 (Maintenance)" />
      </div>
    </div>
  );
}

// 分頁組件 (D): 資料管理
function DataManagement() {
  return (
    <div className="space-y-8">
      <SectionTitle title="資料備份與匯出" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="flex items-center gap-4 p-6 border-2 border-dashed rounded-3xl hover:bg-indigo-50 hover:border-indigo-200 transition-all group">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><FileDown/></div>
          <div className="text-left">
            <p className="font-bold text-slate-700">匯出全站資料 (Excel)</p>
            <p className="text-xs text-slate-400">備份所有車輛與行程紀錄</p>
          </div>
        </button>
        <button className="flex items-center gap-4 p-6 border-2 border-dashed rounded-3xl hover:bg-rose-50 hover:border-rose-200 transition-all group">
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors"><Trash2/></div>
          <div className="text-left">
            <p className="font-bold text-slate-700 text-rose-600">清除歷史舊紀錄</p>
            <p className="text-xs text-slate-400">僅保留一年內之行程</p>
          </div>
        </button>
      </div>

      <SectionTitle title="近期操作紀錄 (Audit Log)" />
      <div className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 border-b border-white flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <History size={14} className="text-slate-300"/>
              <span>管理員 <b>浩廷</b> 修改了車輛 <b>ABC-123</b> 的保養資訊</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">2025-03-02 10:30</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 輔助組件 (內部)
function SectionTitle({ title }: any) {
  return <h3 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-600 pl-4 mb-6">{title}</h3>;
}

function SettingItem({ label, desc, children }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <p className="text-xs text-slate-400 mb-2">{desc}</p>
      {children}
    </div>
  );
}

function CheckboxItem({ label, desc, checked = false }: any) {
  return (
    <label className="flex items-center gap-4 p-4 rounded-2xl border hover:bg-slate-50 cursor-pointer transition-colors">
      <input type="checkbox" defaultChecked={checked} className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300" />
      <div>
        <p className="text-sm font-bold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </label>
  );
}

function ColorLabel({ color, label }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border">
      <div className="w-6 h-6 rounded-lg shadow-sm" style={{ backgroundColor: color }}></div>
      <span className="text-xs font-bold text-slate-600">{label}</span>
    </div>
  );
}

function AuthSettings() {
  return (
    <div className="space-y-6">
      <SectionTitle title="人員角色與權限分配" />
      <div className="space-y-4">
        <RoleCard role="管理員 (Admin)" desc="具備全系統設定、人員增減與資料清除權限。" />
        <RoleCard role="調度員 (Dispatcher)" desc="可新增/編輯所有車輛行程，查看統計報表。" />
        <RoleCard role="採樣組員 (Staff)" desc="僅能查看行程月曆，無法刪除他人行程。" />
      </div>
    </div>
  );
}

function RoleCard({ role, desc }: any) {
  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
      <div>
        <p className="font-bold text-slate-800">{role}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <button className="text-indigo-600 text-xs font-bold hover:underline">編輯對象</button>
    </div>
  );
}
