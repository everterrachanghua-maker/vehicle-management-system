import { Car, ChevronRight } from 'lucide-react';

export default function Garage({ vehicles, onSelectVehicle }: any) {
  return (
    <div className="space-y-6">
      {/* 頁首標題區：移除按鈕，僅保留文字說明 */}
      <div className="mb-8">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">目前在線車輛</h2>
        <p className="text-xs text-slate-400 mt-1">點選下方車輛卡片進行里程填報</p>
      </div>

      {/* 車輛清單網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-slate-300 italic border-2 border-dashed border-slate-200 rounded-3xl">
            目前車庫尚無資產，請聯繫管理員新增
          </div>
        ) : (
          vehicles.map((v: any) => (
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
                <p className="text-sm font-black text-slate-700">
                  {v.current_odo ? v.current_odo.toLocaleString() : 0} km
                </p>
                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-500 uppercase mt-1">
                  立即填報 <ChevronRight size={10} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
