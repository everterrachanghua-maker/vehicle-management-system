import { useState } from 'react';
import { Car, ChevronRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

// 定義資料型別
interface Vehicle {
  id: string;
  name: string;
  plate: string;
  current_odo: number;
}

interface GarageProps {
  vehicles: Vehicle[];
  isAdmin: boolean;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export default function Garage({ vehicles, isAdmin, onSelectVehicle }: GarageProps) {
  const [showAdd, setShowAdd] = useState(false);

  // 處理新增車輛提交
  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await addDoc(collection(db, "vehicles"), { 
        name: formData.get('name') as string, 
        plate: (formData.get('plate') as string).toUpperCase(), 
        current_odo: Number(formData.get('odo')) || 0 
      });
      setShowAdd(false);
      // 這裡可以選擇是否要 reload 頁面或由父組件監聽 firestore
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("新增失敗，請檢查權限");
    }
  };

  return (
    <div className="space-y-6">
      {/* 標題欄 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">目前在線車輛</h2>
          <p className="text-xs text-slate-500">點選車輛進行里程填報</p>
        </div>
        
        {/* 只有 Admin 能看見「新增資產」按鈕 */}
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(!showAdd)} 
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            {showAdd ? '取消新增' : '+ 新增車輛資產'}
          </button>
        )}
      </div>

      {/* 快速新增車輛表單 (Admin 專用) */}
      {showAdd && isAdmin && (
        <form onSubmit={handleAddVehicle} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-slate-800">建立新車輛</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="name" placeholder="車輛名稱 (例: 採樣01)" className="p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 text-sm" required />
            <input name="plate" placeholder="車牌號碼" className="p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 text-sm" required />
            <input name="odo" type="number" placeholder="初始總里程" className="p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 text-sm" required />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-400 font-bold text-sm">取消</button>
            <button type="submit" className="bg-[#0f172a] text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">確認入庫</button>
          </div>
        </form>
      )}

      {/* 車輛清單網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((v) => (
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
                <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{v.name}</h3>
                <p className="text-xs font-mono text-slate-400 font-bold">{v.plate}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-700">{(v.current_odo || 0).toLocaleString()} km</p>
              <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-500 uppercase mt-1">
                立即填報 <ChevronRight size={10} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 text-sm">目前車庫暫無車輛</p>
        </div>
      )}
    </div>
  );
}
