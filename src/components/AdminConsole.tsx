import { useState, useEffect } from 'react';
import { 
  Users, History, AlertTriangle, ShieldCheck, 
  Search, UserPlus, Lock, Trash2, Edit, CheckCircle, X, ShieldAlert
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { logAudit } from '../lib/audit';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminConsole({ currentUser }: any) {
  const [activeTab, setActiveTab] = useState('users');

  // 權限檢查：只有 Admin 和 Dispatcher 能進來
  if (currentUser.role === 'staff') {
    return <div className="p-20 text-center text-rose-500 font-bold">權限不足，請聯繫系統管理員。</div>;
  }

  const tabs = [
    { id: 'users', label: '使用者管理', icon: <Users size={18}/>, adminOnly: true },
    { id: 'logs', label: '操作稽核日誌', icon: <History size={18}/>, adminOnly: false },
    { id: 'exceptions', label: '里程異常覆寫', icon: <AlertTriangle size={18}/>, adminOnly: false },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 次級導覽 */}
      <div className="flex gap-2 bg-white p-2 rounded-3xl border shadow-sm w-fit">
        {tabs.map(tab => (
          (tab.adminOnly && currentUser.role !== 'admin') ? null : (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          )
        ))}
      </div>

      {/* 內容區塊 */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
            {activeTab === 'users' && <UserManagement currentUser={currentUser} />}
            {activeTab === 'logs' && <AuditLogView />}
            {activeTab === 'exceptions' && <OdometerExceptions currentUser={currentUser} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- 1. 使用者管理組件 ---
function UserManagement({ currentUser }: any) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchUsers();
  }, []);

  const toggleUserStatus = async (user: any) => {
    if (user.id === currentUser.id) return alert("不能停用自己！");
    const newStatus = !user.isActive;
    await updateDoc(doc(db, "users", user.id), { isActive: newStatus });
    await logAudit(currentUser, 'UPDATE', 'USER', { target: user.name, action: newStatus ? '啟用' : '停用' });
    alert(`使用者 ${user.name} 已${newStatus ? '啟用' : '停用'}`);
  };

  return (
    <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">系統人員權限清單</h3>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-md">
          <UserPlus size={18}/> 新增人員
        </button>
      </div>
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold sticky top-0 z-10">
            <tr>
              <th className="px-8 py-4">姓名 / 帳號</th>
              <th className="px-8 py-4">角色權限</th>
              <th className="px-8 py-4">所屬駐點</th>
              <th className="px-8 py-4">目前狀態</th>
              <th className="px-8 py-4">快速操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-4">
                  <p className="font-bold text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                </td>
                <td className="px-8 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    u.role === 'admin' ? 'bg-rose-100 text-rose-600' : 
                    u.role === 'dispatcher' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-4 text-sm font-medium text-slate-600">{u.department}</td>
                <td className="px-8 py-4">
                  <button 
                    onClick={() => toggleUserStatus(u)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {u.isActive ? '使用中' : '已停用'}
                  </button>
                </td>
                <td className="px-8 py-4">
                  <div className="flex gap-2 text-slate-300">
                    <button className="p-2 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-lg transition-all"><Edit size={16}/></button>
                    <button className="p-2 hover:bg-white hover:text-rose-600 hover:shadow-sm rounded-lg transition-all"><Lock size={16}/></button>
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

// --- 2. 稽核日誌組件 ---
function AuditLogView() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const snap = await getDocs(query(collection(db, "audit_logs"), orderBy("timestamp", "desc")));
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-8 border-b bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">資料稽核紀錄 (Audit Log)</h3>
          <p className="text-xs text-slate-400">所有新增、修改、刪除動作皆由系統自動錄入</p>
        </div>
        <button className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">匯出完整日誌</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {log
