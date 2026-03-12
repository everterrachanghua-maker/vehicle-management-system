import { useState } from 'react';
import { Car, ChevronRight, PlusCircle, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

// 1. 定義完整的資料型別
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
  // 狀態管理：是否顯示新增表單
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. 處理新增車輛提交 (Firebase 邏輯)
  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const plate = (formData.get('plate') as string).toUpperCase();
    const odo = Number(formData.get('odo')) || 0;

    try {
      await addDoc(collection(db, "vehicles"), { 
        name, 
        plate, 
        current_odo: odo 
      });
      setShowAdd(false); // 成功後關閉表單
      (e.target as HTMLFormElement).reset(); // 清空輸入內容
    } catch (error) {
      console.error("Error adding vehicle: ", error);
      alert("新增失敗，請檢查網路或權限");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題與管理按鈕 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">目前在線車輛</h2>
          <p className="text-xs text-slate-500 mt-1">點選車輛卡片進行里程數據填報</p>
        </div>
        
        {/* 只有 Admin 能看見「新增資產」按鈕 */}
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(!showAdd)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
              showAdd 
              ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 shadow-none' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
            }`}
          >
            {showAdd ? <X size={14} /> : <PlusCircle size={14} />}
            {showAdd ? '取消新增' : '新增車輛資產'}
          </button>
        )}
      </div>

      {/* 快速新增車輛表單 (Admin 專用，附帶動畫效果) */}
      {showAdd && isAdmin && (
        <form 
          onSubmit={handleAddVehicle} 
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Car size={18} className="text-emerald-500" /> 建立新車輛資產
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">車輛名稱</label>
              <input name="name" placeholder="例：公務車 01" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 text-sm" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">車牌號碼</label>
              <input name="plate" placeholder="例：ABC-1234" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 text-sm font-mono" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">初始里程 (km)</label>
              <input name="odo" type="number" placeholder="0" className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 text-sm" required />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button 
              disabled={isSubmitting}
              type="submit" 
              className="bg-[#0f172a] text-white px-8 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? '處理中...' : '確認入庫'}
            </button>
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
                <h3 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {v.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 font-bold tracking-wider">
                  {v.plate}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-700">
                {(v.current_odo || 0).toLocaleString()} <span className="text-[10px] text-slate-400 ml-0.5">km</span>
              </p>
              <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-500 uppercase mt-1">
                立即填報 <ChevronRight size={10} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 缺省狀態：當沒有車輛時 */}
      {vehicles.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
          <Car className="mx-auto text-slate-200 mb-4" size={48} />
          <p className="text-slate-400 text-sm font-medium">目前車庫暫無車輛資料</p>
          {isAdmin && (
            <button 
              onClick={() => setShowAdd(true)}
              className="mt-4 text-emerald-600 text-xs font-bold hover:underline"
            >
              點此新增第一台車輛
            </button>
          )}
        </div>
      )}
    </div>
  );
}
