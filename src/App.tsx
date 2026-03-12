import { useState, useEffect } from 'react';
import { List, PlusCircle, BarChart3, Car } from 'lucide-react';
import { db } from './lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

import Garage from './components/Garage';
import LogForm from './components/LogForm';
import SimpleStats from './components/SimpleStats';

export default function App() {
  const [activeTab, setActiveTab] = useState('garage');
  const [vehicles, setVehicles] = useState<any[]>([]);

  // 監聽車輛清單
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vehicles"), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <header className="bg-white border-b p-6 mb-6 shadow-sm">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <Car size={24} /> 採樣組車輛管理
        </h1>
      </header>

      <main className="max-w-md mx-auto px-4">
        {activeTab === 'garage' && <Garage vehicles={vehicles} />}
        {activeTab === 'log' && <LogForm vehicles={vehicles} onSuccess={() => setActiveTab('garage')} />}
        {activeTab === 'stats' && <SimpleStats vehicles={vehicles} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-4 z-50 shadow-lg">
        <button 
          onClick={() => setActiveTab('garage')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'garage' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <List size={24} />
          <span className="text-[10px] font-bold">車庫</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('log')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'log' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <PlusCircle size={24} />
          <span className="text-[10px] font-bold">記一筆</span>
        </button>

        <button 
          onClick={() => setActiveTab('stats')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <BarChart3 size={24} />
          <span className="text-[10px] font-bold">統計</span>
        </button>
      </nav>
    </div>
  );
}
