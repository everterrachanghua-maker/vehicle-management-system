import { useState } from 'react';
import { Car, ChevronRight, PlusCircle, X, AlertCircle, Hash } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

// 1. 定義完整的型別
interface Vehicle {
  id: string;
  name: string;
  plate: string;
  current_odo: number;
  status?: 'available' | 'maintenance';
  imgUrl?: string; // 支援圖片顯示
}

interface GarageProps {
  vehicles: Vehicle[];
  isAdmin: boolean;
  onSelectVehicle: (vehicle: Vehicle) => void;
}

export default function Garage({ vehicles, isAdmin, onSelectVehicle }: GarageProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 核心功能：平滑捲動至指定車輛位置
  const scrollToVehicle = (id: string) => {
    const element = document.getElementById(`vehicle-card-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // 2. 處理管理員新增車輛 (Firebase 邏輯)
  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await addDoc(collection(db, "vehicles"), { 
        name: formData.get('name') as string, 
        plate: (formData.get('plate') as string).toUpperCase(), 
        current_odo: Number(formData.get('odo')) || 0,
        status: 'available',
        createdAt: new Date()
      });
      setShowAdd(false);
    } catch (error) {
      console.error(error);
      alert("新增失敗，請檢查網路權限");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* 頁首標題與管理按鈕 */}
      <div className="flex justify-between items-end">
        <div className="relative">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">目前在線車輛</h2>
          <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
            <AlertCircle size={14}/> 點選索引或下方卡片進行數據填報
          </p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAdd(!showAdd)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-xl hover:scale-105 active:scale-95 ${
              showAdd 
              ? 'bg-slate-200 text-slate-600' 
              : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'
            }`}
          >
            {showAdd ? <X size={16} /> : <PlusCircle size={16} />}
            {showAdd ? '取消新增' : '新增車輛資產'}
          </button>
        )}
      </div>

      {/* Admin 快速新增表單 (帶有進入動畫) */}
      {showAdd && isAdmin && (
        <form onSubmit={handleAddVehicle} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-2xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">車輛名稱</label>
              <input name="name" placeholder="例如：Toyota Cross" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-none focus:ring-2 ring-emerald-500 font-bold" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">車牌號碼</label>
              <input name="plate" placeholder="ABC-1234" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-none focus:ring-2 ring-emerald-500 font-mono font-bold" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">初始里程數</label>
              <input name="odo" type="number" placeholder="0" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm outline-none focus:ring-2 ring-emerald-500 font-mono font-bold" required />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button disabled={isSubmitting} className="bg-[#0f172a] text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50">
              {isSubmitting ? '處理中...' : '確認入庫'}
            </button>
          </div>
        </form>
      )}

      {/* 快速索引選單區 */}
      {vehicles.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Hash size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">快速索引選單</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {vehicles.map((v) => (
              <button
                key={`nav-${v.id}`}
                onClick={() => scrollToVehicle(v.id)}
                className="bg-white border border-slate-200 p-3 rounded-xl text-xs font-mono font-bold text-slate-500 hover:border-emerald-500 hover:text-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors"></div>
                {v.plate}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 車輛詳細卡片網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {vehicles.length === 0 ? (
          <div className="col-span-2 py-32 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
            <Car size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">目前車庫尚無資產，請聯繫管理員</p>
          </div>
        ) : (
          vehicles.map((v) => {
            const isMaintenance = v.status === 'maintenance';

            return (
              <div 
                id={`vehicle-card-${v.id}`} // 設定捲動錨點 ID
                key={v.id} 
                onClick={() => {
                  if (isMaintenance) {
                    alert(`⚠️ 車輛 ${v.name} 維修中，暫停里程填報。`);
                    return;
                  }
                  onSelectVehicle(v);
                }}
                className={`group relative bg-white p-8 rounded-[32px] border transition-all duration-500 
                  ${isMaintenance 
                    ? 'opacity-60 grayscale bg-slate-50 cursor-not-allowed border-slate-200' 
                    : 'border-slate-100 hover:border-emerald-500/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] cursor-pointer hover:-translate-y-1'
                  }`}
              >
                {/* 狀態標籤與大頭貼 */}
                <div className="flex justify-between items-start mb-8">
                  <div className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-500 shadow-inner
                    ${isMaintenance ? 'bg-slate-200' : 'bg-slate-50 group-hover:bg-emerald-500 group-hover:shadow-emerald-500/30'}`}>
                    {v.imgUrl ? (
                      <img src={v.imgUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Car size={32} className={`transition-colors ${isMaintenance ? 'text-slate-400' : 'text-slate-300 group-hover:text-white'}`} />
                    )}
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border
                    ${isMaintenance ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {isMaintenance ? '維修中 (Maintenance)' : '可填報 (Available)'}
                  </div>
                </div>

                {/* 車輛標題 */}
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {v.name}
                  </h3>
                  <p className="text-sm font-mono font-bold text-slate-400 tracking-tighter uppercase">
                    {v.plate}
                  </p>
                </div>

                {/* 里程數與按鈕 */}
                <div className="mt-8 pt-8 border-t border-slate-50 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">目前總里程數</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-700 font-mono tracking-tighter">
                        {(v.current_odo || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase">km</span>
                    </div>
                  </div>
                  
                  {!isMaintenance && (
                    <div className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl text-xs font-black group-hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 group-hover:shadow-emerald-500/20">
                      立即填報 <ChevronRight size={14} />
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
