import { useState } from 'react';
import { Car, ChevronRight, PlusCircle, X, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

// 定義資料型別
interface Vehicle {
  id: string;
  name: string;
  plate: string;
  current_odo: number;
  status?: 'available' | 'maintenance';
}

interface GarageProps {
  vehicles: Vehicle[];
  isAdmin: boolean;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export default function Garage({ vehicles, isAdmin, onSelectVehicle }: GarageProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 處理管理員新增車輛
  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await addDoc(collection(db, "vehicles"), { 
        name: formData.get('name') as string, 
        plate: (formData.get('plate') as string).toUpperCase(), 
        current_odo: Number(formData.get('odo')) || 0,
        status: 'available' // 預設為可用
      });
      setShowAdd(false);
    } catch (error) {
      console.error(error);
      alert("新增失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 頁首標題與管理按鈕 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">目前在線車輛</h2>
          <p className="text-xs text-slate-500 mt-1">點選下方車輛卡片進行里程填報</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(!showAdd)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              showAdd ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 text-white shadow-emerald-600/20'
            }`}
          >
            {showAdd ? <X size={14} /> : <PlusCircle size={14} />}
            {showAdd ? '取消' : '新增資產'}
          </button>
        )}
      </div>

      {/* Admin 快速新增表單 */}
      {showAdd && isAdmin && (
        <form onSubmit={handleAddVehicle} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input name="name" placeholder="車輛名稱" className="p-3 bg-slate-50 rounded-xl border-none text-sm outline-none focus:ring-2 ring-emerald-500" required />
            <input name="plate" placeholder="車牌號碼" className="p-3 bg-slate-50 rounded-xl border-none text-sm outline-none focus:ring-2 ring-emerald-500 font-mono" required />
            <input name="odo" type="number" placeholder="目前里程" className="p-3 bg-slate-50 rounded-xl border-none text-sm outline-none focus:ring-2 ring-emerald-500" required />
          </div>
          <div className="flex justify-end">
            <button disabled={isSubmitting} className="bg-[#0f172a] text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
              {isSubmitting ? '處理中...' : '確認入庫'}
            </button>
          </div>
        </form>
      )}

      {/* 車輛清單網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-slate-300 italic border-2 border-dashed border-slate-200 rounded-3xl">
            目前車庫尚無資產
          </div>
        ) : (
          vehicles.map((v) => {
            const isLocked = v.status === 'maintenance';

            return (
              <div 
                key={v.id} 
                onClick={() => {
                  if (isLocked) {
                    alert(`⚠️ 車輛 ${v.name} 維修中，暫停里程填報。`);
                    return;
                  }
                  onSelectVehicle(v);
                }}
                className={`group bg-white p-6 rounded-2xl border transition-all flex justify-between items-center 
                  ${isLocked 
                    ? 'opacity-50 grayscale bg-slate-50 cursor-not-allowed border-slate-200' 
                    : 'border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer'}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                    ${isLocked 
                      ? 'bg-slate-200 text-slate-400' 
                      : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                    <Car size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 transition-colors group-hover:text-emerald-700">
                      {v.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 font-bold">{v.plate}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  {/* 狀態標籤 */}
                  <div className={`text-[10px] font-black px-2 py-0.5 rounded-full mb-1 inline-flex items-center gap-1 uppercase tracking-tighter
                    ${isLocked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isLocked ? (
                      <><AlertCircle size={10} /> 維修中</>
                    ) : (
                      '可填報'
                    )}
                  </div>
                  
                  <p className="text-sm font-black text-slate-700">
                    {(v.current_odo || 0).toLocaleString()} <span className="text-[10px] text-slate-400">km</span>
                  </p>
                  
                  {!isLocked && (
                    <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-500 uppercase mt-1">
                      立即填報 <ChevronRight size={10} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
