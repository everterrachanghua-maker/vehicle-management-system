import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { User, Lock, Car } from 'lucide-react';

export default function Login({ onLogin }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchUsers();
  }, []);

  const handleLogin = (e: any) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedId);
    if (user && user.password === password) {
      onLogin(user);
    } else {
      alert("密碼錯誤！");
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="bg-white/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Car size={32} />
          </div>
          <h2 className="text-2xl font-black italic">Sampling Vehicle</h2>
          <p className="text-indigo-200 text-sm">請選擇人員並登入</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <select 
            className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 text-white font-bold"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            required
          >
            <option value="" className="text-slate-900">-- 選擇您的姓名 --</option>
            {users.map(u => <option key={u.id} value={u.id} className="text-slate-900">{u.name} ({u.role})</option>)}
          </select>

          <input 
            type="password" 
            placeholder="請輸入密碼"
            className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:bg-white/20 placeholder:text-indigo-200"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-50 transition-all">
            進入系統
          </button>
        </form>
      </div>
    </div>
  );
}
