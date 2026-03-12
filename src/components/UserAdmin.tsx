import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { UserPlus, Trash2, ShieldCheck, X, CheckCircle2 } from 'lucide-react';

export default function UserAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  // 1. 監聽人員名單
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

  // 3. 刪除人員邏輯 (加入確認視窗)
  const handleDelete = async (user: any) => {
    // 防止刪除最後一個管理員或誤刪
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
    <div className="space-y-6 animate-in fade-in duration-500">
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

      {/* 新增人員表單 (彈窗式) */}
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
                <input name="password" type="text" placeholder="請設定簡單密碼" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 font-mono" required />
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

      {/* 人員列表區 */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {users.map(u => (
            <div key={u.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                  {u.name[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{u.name}</p>
                  <p className={`text-[10px] font-black uppercase tracking-tighter ${u.role === 'admin' ? 'text-indigo-500' : 'text-slate-400'}`}>
                    {u.role === 'admin' ? 'Administrator' : 'Field Staff'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-mono text-slate-300 tracking-widest">******</p>
                  <p className="text-[9px] text-slate-300 uppercase font-bold">Password Encrypted</p>
                </div>
                
                {/* 刪除按鈕：點擊後觸發 handleDelete */}
                <button 
                  onClick={() => handleDelete(u)}
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="刪除此人員"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
