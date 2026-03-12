import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Fuel, Droplets, CheckCircle2 } from 'lucide-react';

export default function LogForm({ vehicle, user, onSuccess, onCancel }: any) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const startOdo = Number(e.target.start_odo.value);
    const endOdo = Number(e.target.end_odo.value);
    const hasFuel = e.target.has_fuel.checked;
    const hasWash = e.target.has_wash.checked;

    if (endOdo < startOdo) {
      alert("錯誤：結束里程不能小於初始里程！");
      setLoading(false);
      return;
    }

    try {
      // 1. 存入詳細紀錄
      await addDoc(collection(db, "records"), {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        vehiclePlate: vehicle.plate,
        userName: user.name,
        date: new Date().toISOString().split('T')[0],
        startOdo,
        endOdo,
        mileageDiff: endOdo - startOdo,
        hasFuel,
        hasWash,
        createdAt: serverTimestamp()
      });

      // 2. 更新車輛主表的最新里程
      await updateDoc(doc(db, "vehicles", vehicle.id), {
        current_odo: endOdo
      });

      alert("里程填報成功！");
      onSuccess();
    } catch (err) {
      alert("儲存失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onCancel} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-6 font-bold transition-colors">
        <ArrowLeft size={18} /> 返回清單
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800">里程與維護填報</h2>
            <p className="text-xs font-bold text-emerald-600 mt-1">{vehicle.name} ({vehicle.plate})</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">填報人</p>
            <p className="text-sm font-bold text-slate-700">{user.name}</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* 里程區塊 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">本次初始里程 (km)</label>
              <input 
                name="start_odo" 
                type="number" 
                defaultValue={vehicle.current_odo}
                className="w-full p-4 bg-slate-100 rounded-2xl border-none text-lg font-bold outline-none focus:ring-2 ring-emerald-500" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase">本次結束里程 (km)</label>
              <input 
                name="end_odo" 
                type="number" 
                placeholder="請輸入"
                className="w-full p-4 bg-emerald-50 rounded-2xl border-none text-lg font-bold text-emerald-700 outline-none focus:ring-2 ring-emerald-500" 
                required 
              />
            </div>
          </div>

          {/* 勾選區塊 */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors border-2 border-transparent has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                  <Fuel size={20} />
                </div>
                <span className="font-bold text-slate-700">本次有加油</span>
              </div>
              <input name="has_fuel" type="checkbox" className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            </label>

            <label className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors border-2 border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                  <Droplets size={20} />
                </div>
                <span className="font-bold text-slate-700">本次有洗車</span>
              </div>
              <input name="has_wash" type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            </label>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t">
          <button 
            disabled={loading}
            className="w-full bg-[#0f172a] text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
          >
            {loading ? "提交中..." : <><CheckCircle2 size={24}/> 確認送出數據</>}
          </button>
        </div>
      </form>
    </div>
  );
}
