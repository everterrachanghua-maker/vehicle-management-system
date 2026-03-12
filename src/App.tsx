import { useState } from 'react';
import { Car, ChevronRight, Plus } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function Garage({ vehicles, isAdmin, onSelectVehicle }: any) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">目前在線車輛</h2>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
            + 新增車輛資產
          </button>
        )}
      </div>

      {/* 快速新增車輛 (Admin 專用) */}
      {showAdd && (
        <form onSubmit={async (e:any) => {
          e.preventDefault();
          await addDoc(collection(db, "vehicles"), { 
            name: e.target.name.value, 
            plate: e.target.plate.value.toUpperCase(), 
            current_odo: Number(e.target.odo.value) || 0 
          });
          setShowAdd(false);
        }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 mb-8">
          <div className="grid grid-cols-3 gap-4">
            <input name="name" placeholder="車輛名稱 (例: 採樣01)" className="p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500" required />
            <input name="plate" placeholder="車牌號碼" className="p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500" required />
            <input name="odo" type="number" placeholder="初始總里程" className="p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500" required />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-400 font-bold">取消</button>
            <button className="bg-[#0f172a] text-white px-6 py-2 rounded-xl font-bold">確認入庫</button>
          </div>
        </form>
      )}

      {/* 車輛清單網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((v: any) => (
          <div 
            key={v.id} 
            onClick={() => onSelectVehicle(v)}
            className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex justify-between items-center"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 rounded-xl flex items-center justify-center transition-colors">
                <Car size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{v.name}</h3>
                <p className="text-xs font-mono text-slate-400 font-bold">{v.plate}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-700">{v.current_odo?.toLocaleString()} km</p>
              <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-500 uppercase mt-1">
                立即填報 <ChevronRight size={10} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
