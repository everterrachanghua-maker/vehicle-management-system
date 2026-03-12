import { useState, useEffect } from 'react';
import { List, PlusCircle, BarChart3, Car, Users, Lock, LogOut } from 'lucide-react';
import { db } from './lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// 引入組件
import Login from './components/Login';
import Garage from './components/Garage';
import LogForm from './components/LogForm';
import SimpleStats from './components/SimpleStats';
import UserAdmin from './components/UserAdmin';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('garage');
  const [vehicles, setVehicles] = useState<any[]>([]);

  // 1. 自動檢查 Session (可選)
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  // 2. 監聽車輛
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vehicles"), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 如果未登入，顯示登入介面
  if (!currentUser) {
    return <Login onLogin={(user: any) => {
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
    }} />;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <header className="bg-white border-b p-4 mb-6 shadow-sm flex justify-between items-center">
        <h1 className="text-lg font-bold text-indigo-600 flex items-center gap-2">
          <Car size={20} /> 採樣車輛管理
        </h1>
        <button 
          onClick={() => { setCurrentUser(null); localStorage.removeItem('user'); }}
          className="text-slate-400 p-2 hover:bg-slate-100 rounded-full"
        >
          <LogOut size={18} />
        </button>
      </header>

      <main className="max-w-md mx-auto px-4">
        {/* 根據分頁切換內容 */}
        {activeTab === 'garage' && <Garage vehicles={vehicles} isAdmin={isAdmin} />}
        {activeTab === 'log' && <LogForm vehicles={vehicles} user={currentUser} onSuccess={() => setActiveTab('garage')} />}
        {activeTab === 'stats' && isAdmin && <SimpleStats vehicles={vehicles} />}
        {activeTab === 'users' && isAdmin && <UserAdmin />}
      </main>

      {/* 底部導航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-4 z-50">
        <NavBtn icon={<List />} label="車庫" active={activeTab === 'garage'} onClick={() => setActiveTab('garage')} />
        <NavBtn icon={<PlusCircle />} label="記一筆" active={activeTab === 'log'} onClick={() => setActiveTab('log')} />
        
        {/* 管理員限定按鈕 */}
        {isAdmin && (
          <>
            <NavBtn icon={<BarChart3 />} label="統計" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
            <NavBtn icon={<Users />} label="人員" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          </>
        )}
      </nav>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
