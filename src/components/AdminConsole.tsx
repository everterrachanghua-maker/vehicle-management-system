import { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, History, AlertOctagon, Settings, 
  Search, UserPlus, Lock, ShieldAlert, Trash2, Edit 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, where, updateDoc, doc } from "firebase/firestore";

export default function AdminConsole({ userRole }: { userRole: string }) {
  const [activeTab, setActiveTab] = useState('users');

  // 如果不是 Admin 或 Dispatcher，阻擋進入
  if (userRole === 'staff') return <div className="p-20 text-center font-bold text-rose-500">權限不足，請聯繫管理員。</div>;

  const tabs = [
    { id: 'users', label: '使用者管理', icon: <Users size={18}/>, adminOnly: true },
    { id: 'logs', label: '操作稽核日誌', icon: <History size={18}/>, adminOnly: false },
    { id: 'exceptions', label: '里程異常管理', icon: <AlertOctagon size={18}/>, adminOnly: false },
    { id: 'config', label: '進階系統設定', icon: <Settings size={18}/>, adminOnly: true },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex gap-2 bg-white p-2 rounded-2xl border shadow-sm w-fit">
        {tabs.map(tab => {
          if (tab.adminOnly && userRole !== 'admin') return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="h-full"
          >
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'logs' && <AuditLogView />}
            {activeTab === 'exceptions' && <OdometerExceptions />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- 子組件: 使用者管理 ---
function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchUsers();
  }, []);

  return (
    <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800">全站使用者名單</h3>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
          <UserPlus size={16}/> 新增帳號
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold sticky top-0">
            <tr>
              <th className="px-6 py-4">姓名 / 帳號</th>
              <th className="px-6 py-4">角色</th>
              <th className="px-6 py-4">部門</th>
              <th className="px-6 py-4">狀態</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-700">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                    u.role === 'admin' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                  }`}>{u.role}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{u.department}</td>
                <td className="px-6 py-4">
                  <span className={`w-2 h-2 rounded-full inline-block mr-2 ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  <span className="text-xs font-medium text-slate-600">{u.isActive ? '啟用中' : '已停用'}</span>
                </td>
                <td className="px-6 py-4">
                   <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={16}/></button>
                      <button className="p-2 text-slate-400 hover:text-rose-600"><Lock size={16}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- 子組件: 稽核日誌 ---
function AuditLogView() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden h-full flex flex-col">
       <div className="p-6 border-b flex justify-between bg-slate-900 text-white">
          <h3 className="font-bold">資料變更稽核紀錄</h3>
          <button className="text-xs border border-slate-700 px-3 py-1 rounded-lg hover:bg-slate-800 transition-colors">匯出日誌 (CSV)</button>
       </div>
       <div className="flex-1 overflow-y-auto">
          {logs.map(log => (
            <div key={log.id} className="p-4 border-b hover:bg-slate-50 flex items-start gap-4">
               <div className={`p-2 rounded-lg ${log.action === 'DELETE' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                  {log.action === 'DELETE' ? <Trash2 size={16}/> : <History size={16}/>}
               </div>
               <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    <span className="text-indigo-600">{log.userName}</span> {log.action} 了 {log.module}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 italic">"{log.reason || '未填寫原因'}"</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-mono text-slate-400">{log.timestamp?.toDate().toLocaleString()}</p>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}

// --- 子組件: 里程異常管理 ---
function OdometerExceptions() {
  return (
    <div className="bg-white rounded-[32px] border shadow-sm p-8 text-center space-y-4">
      <ShieldAlert size={48} className="mx-auto text-amber-500 opacity-20"/>
      <h3 className="text-xl font-bold text-slate-700">里程異常偵測模組</h3>
      <p className="text-slate-400 max-w-md mx-auto">系統將自動標示出「里程倒退」或「跳動異常 (300km+)」之紀錄，Admin 可在此進行強制覆寫或修正。</p>
      <div className="pt-4">
         <button className="bg-slate-100 text-slate-500 px-6 py-2 rounded-xl font-bold">查看待審核清單 (0)</button>
      </div>
    </div>
  );
}
