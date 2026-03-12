import { useState, useEffect } from 'react';
import { Car, PlusCircle, BarChart3, List } from 'lucide-react';
import { db } from './lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// 引入簡化後的組件
import Garage from './components/Garage';
import LogForm from './components/LogForm';
import SimpleStats from './components/SimpleStats';

export default function App() {
  const [activeTab, setActiveTab] = useState('garage');
  const [vehicles, setVehicles] = useState<any[]>([]);

  // 全域監聽車輛清單，供各頁面使用
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vehicles"), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* 頂部標題 */}
      <header className="bg-white border-b p-6 mb-6 shadow-sm">
        <h1 className="text-xl font-black text-indigo-600 flex items-center gap-2">
          <Car /> 採樣車輛管理簡易版
        </h1>
      </header>

      {/* 主內容區 */}
      <main className="max-w-md mx-auto px-4">
        {activeTab === 'garage' && <Garage vehicles={vehicles} />}
        {activeTab === 'log' && <LogForm vehicles={vehicles} onSuccess={() => setActiveTab('garage')} />}
        {activeTab === 'stats' && <SimpleStats vehicles={vehicles} />}
      </main>

      {/* 底部導航列 (手機版優先設計，方便外勤操作) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <NavBtn icon={<List />} label="車庫" active={activeTab === 'garage'} onClick={() => setActiveTab('garage')} />
        <NavBtn icon={<PlusCircle />} label="記一筆" active={activeTab === 'log'} onClick={() => setActiveTab('log')} />
        <NavBtn icon={<BarChart3 />} label="統計" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
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
      )}
    </button>
  );
}
