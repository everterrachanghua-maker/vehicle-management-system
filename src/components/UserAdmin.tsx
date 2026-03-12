import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { UserPlus, Trash2, ShieldCheck, X, CheckCircle2, Edit3, Save } from 'lucide-react';

export default function UserAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null); // 控制編輯彈窗

  // 1. 監聽人員名單 (實時同步)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 2. 新增人員邏輯
  const addUser = async (e: any) => {
    e.preventDefault();
    const name = e.target.name.value;
    const password = e.target.password.value;
    const role = e.target.role.value;

    try {
      await addDoc(collection(db, "users"), {
        name,
        password,
        role,
        isActive: true,
        createdAt: new Date()
      });
      setShowAdd(false);
      e.target.reset();
    } catch (err) {
      alert("新增失敗，請檢查權限");
    }
  };

  // 3. 更新人員資料邏輯
  const handleUpdateUser = async (e: any) => {
    e.preventDefault();
    const { id, name, password, role } = editingUser;
    try {
      await updateDoc(doc(db, "users", id), { name, password, role });
      setEditingUser(null); // 關閉彈窗
      alert("人員資料已成功更新");
    } catch (err) {
      alert("更新失敗");
    }
  };

  // 4. 刪除人員邏輯
  const handleDelete = async (user: any) => {
    const confirmDelete = window.confirm(`警告：您確定要永久刪除員工「${user.name}」嗎？\n刪除後該人員將無法登入系統。`);
    
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "users", user.id));
      } catch (err) {
        alert("刪除失敗");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* 頁首：標題與新增按鈕 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">系統人員權限清單</h2>
          <p className="text-xs text-slate-400 mt-1">目前共有 {users.length} 位人員</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)} 
          className="bg-[#0f172a] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
        >
          <UserPlus size={16} /> 新增人員
        </button>
      </div>

      {/* --- A. 新增人員彈窗 (Modal) --- */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={addUser} className="bg-white w-full max-w-md rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-[#0f172a] text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">建立新的人員帳號</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">員工姓名</label>
                <input name="name" placeholder="請輸入姓名" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">登入密碼</label>
                <input name="password" type="text" placeholder="請設定登入密碼" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 font-mono" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">權限角色</label>
                <select name="role" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 font-bold">
                  <option value="staff">一般員工 (Staff)</option>
                  <option value="admin">管理員 (Admin)</option>
                </select>
              </div>
              <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-4">
                <CheckCircle2 size={20} /> 確認建立人員
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- B. 編輯人員彈窗 (Modal) --- */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateUser} className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-[#0f172a] text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">修改人員權限資料</h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">員工姓名</label>
                <input value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">登入密碼</label>
                <input value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 font-mono" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">權限角色</label>
                <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 font-bold">
                  <option value="staff">一般員工 (Staff)</option>
                  <option value="admin">管理員 (Admin)</option>
                </select>
              </div>
              <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-4">
                <Save size={20} /> 更新帳號資訊
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 人員列表區 */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {users.map(u => (
            <div key={u.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                  {u.name[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{u.name}</p>
                  <p className={`text-[10px] font-black uppercase tracking-tighter ${u.role === 'admin' ? 'text-indigo-500' : 'text-slate-400'}`}>
                    {u.role === 'admin' ? 'Administrator' : 'Field Staff'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* 密碼提示欄位 (隱藏於小螢幕) */}
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-mono text-slate-300 tracking-widest">******</p>
                  <p className="text-[9px] text-slate-300 uppercase font-bold">Security Encrypted</p>
                </div>
                
                {/* 操作按鈕：編輯與刪除 (hover時顯現) */}
                <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button 
                    onClick={() => setEditingUser(u)}
                    className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                    title="編輯人員資料"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(u)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title="永久刪除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
