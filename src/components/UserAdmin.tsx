import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

export default function UserAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const addUser = async (e: any) => {
    e.preventDefault();
    await addDoc(collection(db, "users"), {
      name: e.target.name.value,
      password: e.target.password.value,
      role: e.target.role.value,
      isActive: true
    });
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-500 text-sm">人員清單 ({users.length})</h2>
        <button onClick={() => setShowAdd(true)} className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">+ 新增人員</button>
      </div>

      {showAdd && (
        <form onSubmit={addUser} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
          <input name="name" placeholder="姓名" className="w-full p-3 bg-slate-50 rounded-xl" required />
          <input name="password" placeholder="登入密碼" className="w-full p-3 bg-slate-50 rounded-xl" required />
          <select name="role" className="w-full p-3 bg-slate-50 rounded-xl font-bold">
            <option value="staff">一般員工 (Staff)</option>
            <option value="admin">管理員 (Admin)</option>
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="flex-1 p-3">取消</button>
            <button className="flex-1 bg-indigo-600 text-white p-3 rounded-xl font-bold">確認建立</button>
          </div>
        </form>
      )}

      <div className="divide-y bg-white rounded-3xl border overflow-hidden">
        {users.map(u => (
          <div key={u.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-bold">{u.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-black">{u.role}</p>
            </div>
            <p className="text-xs font-mono text-slate-300">******</p>
          </div>
        ))}
      </div>
    </div>
  );
}
