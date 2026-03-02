import { useState, useEffect } from 'react';
import { 
  Users, History, AlertTriangle, ShieldCheck, 
  Search, UserPlus, Lock, Trash2, Edit, CheckCircle, X, ShieldAlert, MoreHorizontal
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, where, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { logAudit } from '../lib/audit';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminConsole({ currentUser }: any) {
  const [activeTab, setActiveTab] = useState('users');

  // 權限檢查：只有 Admin 和 Dispatcher 能進入此頁
  if (currentUser.role === 'staff') {
    return <div className="p-20 text-center text-rose-500 font-bold bg-white rounded-3xl border">權限不足，請聯繫系統管理員。</div>;
  }

  const tabs = [
    { id: 'users', label: '使用者管理', icon: <Users size={18}/>, adminOnly: true },
    { id: 'logs', label: '操作稽核日誌', icon: <History size={18}/>, adminOnly: false },
    { id: 'exceptions', label: '里程異常覆寫', icon: <AlertTriangle size={18}/>, adminOnly: false },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
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

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
            {activeTab === 'users' && <UserManagement currentUser={currentUser} />}
            {activeTab === 'logs' && <AuditLogView />}
            {activeTab === 'exceptions' && <OdometerExceptions currentUser={currentUser} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function UserManagement({ currentUser }: any) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (user: any) => {
    if (user.id === currentUser.id) return alert("不可停用自己");
    const newStatus = !user.isActive;
    await updateDoc(doc(db, "users", user.id), { isActive: newStatus });
    await logAudit(currentUser, 'UPDATE', 'USER', { target: user.name, action: newStatus ? '啟用' : '停用' });
  };

  return (
    <div className="bg-white rounded-[40px] border shadow-sm h-full flex flex-col overflow-hidden">
      <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">人員權限清單</h3>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-md">
          <UserPlus size={18}/> 新增人員
        </button>
      </div>
      <div className="overflow-y-auto flex-1 text-sm text-slate-600">
        <table className="w-full text-left">
          <thead className="bg-slate-50 sticky top-0">
            <tr className="text-[10px] uppercase text-slate-400 font-bold border-b">
              <th className="px-8 py-4">姓名 / 帳號</th>
              <th className="px-8 py-4">角色</th>
              <th className="px-8 py-4">狀態</th>
              <th className="px-8 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-8 py-4"><b>{u.name}</b><br/><span className="text-xs text-slate-400">{u.email}</span></td>
                <td className="px-8 py-4 uppercase font-bold text-xs">{u.role}</td>
                <td className="px-8 py-4">
                  <button onClick={() => toggleStatus(u)} className={`px-3 py-1 rounded-lg font-bold text-xs ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {u.isActive ? '使用中' : '已停用'}
                  </button>
                </td>
                <td className="px-8 py-4 flex gap-2"><Edit size={16}/><Lock size={16}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditLogView() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white rounded-[40px] border shadow-sm h-full flex flex-col overflow-hidden">
      <div className="p-8 border-b bg-slate-900 text-white flex justify-between items-center">
        <h3 className="text-xl font-bold">稽核日誌 (Audit Log)</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? <p className="p-20 text-center text-slate-300">目前尚無日誌紀錄</p> : 
          logs.map(log => (
            <div key={log.id} className="px-8 py-4 border-b flex items-center gap-6">
              <div className="p-3 bg-slate-100 rounded-2xl text-slate-400"><History size={18} /></div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">
                  <span className="text-indigo-600">{log.operatorName}</span> 執行了 {log.action} ({log.module})
                </p>
                {log.reason && <p className="text-xs text-rose-500 mt-1 font-bold">原因: {log.reason}</p>}
              </div>
              <p className="text-xs font-mono text-slate-400">{log.timestamp?.toDate().toLocaleString()}</p>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function OdometerExceptions({ currentUser }: any) {
  const handleOverride = async () => {
    if (currentUser.role !== 'admin') return alert("僅超級管理員可執行");
    const reason = prompt("請輸入覆寫原因：");
    if (!reason) return;
    await logAudit(currentUser, 'OVERRIDE', 'ODOMETER', { details: '手動覆寫' }, reason);
    alert("已記錄並執行");
  };

  return (
    <div className="bg-white rounded-[40px] border shadow-sm h-full flex flex-col items-center justify-center p-12 text-center">
      <ShieldAlert size={48} className="text-rose-500 mb-6" />
      <h3 className="text-2xl font-bold text-slate-800">里程管理中心</h3>
      <button onClick={handleOverride} className="mt-8 bg-rose-600 text-white px-8 py-4 rounded-3xl font-bold">強制里程覆寫</button>
    </div>
  );
}
