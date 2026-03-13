import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ArrowLeft, MapPin, AlertTriangle, CheckCircle2, 
  ShieldAlert, Fuel, Droplets 
} from 'lucide-react';

export default function LogForm({ vehicle, user, onSuccess, onCancel }: any) {
  const [loading, setLoading] = useState(false);
  const [hasAbnormality, setHasAbnormality] = useState(false); // 異常狀態控制

  const taiwanCounties = [
    "基隆市", "台北市", "新北市", "桃園市", "新竹市", "新竹縣", "苗栗縣", 
    "台中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "台南市", 
    "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣"
  ];

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const startOdo = Number(e.target.start_odo.value);
    const endOdo = Number(e.target.end_odo.value);
    const location = e.target.location.value;
    const hasFuel = e.target.has_fuel.checked;
    const hasWash = e.target.has_wash.checked;

    // 邏輯驗證
    if (endOdo < startOdo) {
      alert("錯誤：結束里程不能小於初始里程！");
      setLoading(false);
      return;
    }
    if (!location) {
      alert("請選擇工作地點");
      setLoading(false);
      return;
    }

    try {
      // 1. 存入詳細紀錄至 records 集合
      await addDoc(collection(db, "records"), {
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        vehiclePlate: vehicle.plate,
        userName: user.name,
        date: new Date().toISOString().split('T')[0],
        startOdo,
        endOdo,
        mileageDiff: endOdo - startOdo,
        location,
        hasFuel,
        hasWash,
        hasAbnormality,
        createdAt: serverTimestamp()
      });

      // 2. 更新車輛主表的最新里程
      await updateDoc(doc(db, "vehicles", vehicle.id), {
        current_odo: endOdo
      });

      alert("填報成功！辛苦了！");
      onSuccess();
    } catch (err) {
      alert("儲存失敗，請檢查網路連線");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* 返回按鈕 */}
      <button onClick={onCancel} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-6 font-bold transition-colors group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回清單
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden">
        {/* 表頭區 - 深色高級質感 */}
        <div className="p-8 bg-[#0f172a] text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black tracking-tight">里程與維護填報</h2>
            <p className="text-xs font-bold text-emerald-400 mt-1 uppercase tracking-widest">{vehicle.name} / {vehicle.plate}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">填報人員</p>
            <p className="text-sm font-bold">{user.name}</p>
          </div>
        </div>

        <div className="p-10 space-y-10">
          
          {/* A. 里程數據區 */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">本次初始里程 (km)</label>
              <input 
                name="start_odo" 
                type="number" 
                defaultValue={vehicle.current_odo || 0}
                className="w-full p-5 bg-slate-50 rounded-3xl border-none text-xl font-black text-slate-400 outline-none" 
                readOnly 
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">本次結束里程 (km)</label>
              <input 
                name="end_odo" 
                type="number" 
                placeholder="輸入目前讀數"
                className="w-full p-5 bg-emerald-50/50 rounded-3xl border-2 border-emerald-100 text-xl font-black text-emerald-700 outline-none focus:border-emerald-500 transition-all placeholder:text-emerald-200" 
                required 
              />
            </div>
          </div>

          {/* B. 工作地點 */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <MapPin size={12}/> 工作地點 (縣市)
            </label>
            <select 
              name="location"
              className="w-full p-5 bg-slate-50 rounded-3xl border-none text-lg font-bold text-slate-700 outline-none focus:ring-2 ring-emerald-500 appearance-none cursor-pointer"
              required
            >
              <option value="">-- 請選擇工作縣市 --</option>
              {taiwanCounties.map(county => <option key={county} value={county}>{county}</option>)}
            </select>
          </div>

          {/* C. 加油與洗車勾選 (保留功能並優化 UI) */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl cursor-pointer hover:bg-slate-100 transition-all border-2 border-transparent has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm">
                  <Fuel size={20} />
                </div>
                <span className="font-bold text-slate-700">本次有加油</span>
              </div>
              <input name="has_fuel" type="checkbox" className="w-6 h-6 rounded-lg border-slate-300 text-orange-500 focus:ring-orange-500" />
            </label>

            <label className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl cursor-pointer hover:bg-slate-100 transition-all border-2 border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                  <Droplets size={20} />
                </div>
                <span className="font-bold text-slate-700">本次有洗車</span>
              </div>
              <input name="has_wash" type="checkbox" className="w-6 h-6 rounded-lg border-slate-300 text-blue-500 focus:ring-blue-500" />
            </label>
          </div>

          {/* D. 異常回報區 */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <ShieldAlert size={12}/> 車輛狀況回報
            </label>
            <div className="flex bg-slate-100 p-1.5 rounded-[20px] w-fit">
              <button 
                type="button"
                onClick={() => setHasAbnormality(false)}
                className={`px-8 py-2.5 rounded-[15px] text-xs font-black transition-all ${!hasAbnormality ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                正常
              </button>
              <button 
                type="button"
                onClick={() => setHasAbnormality(true)}
                className={`px-8 py-2.5 rounded-[15px] text-xs font-black transition-all ${hasAbnormality ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-slate-400'}`}
              >
                有異常
              </button>
            </div>

            {hasAbnormality && (
              <div className="bg-rose-50 border-2 border-rose-100 p-5 rounded-3xl flex items-center gap-4 animate-in zoom-in-95 duration-300">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-50">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-rose-700 font-black text-sm">請將異常情形通報車輛管理員</p>
                  <p className="text-rose-400 text-[10px] font-bold uppercase mt-0.5">Please notify the admin immediately</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* E. 底部提交區 */}
        <div className="p-10 bg-slate-50/50 border-t border-slate-100">
          <button 
            disabled={loading}
            className="w-full bg-[#0f172a] text-white py-5 rounded-[24px] font-black text-lg shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-slate-300"
          >
            {loading ? "數據傳輸中..." : <><CheckCircle2 size={24}/> 確認送出填報數據</>}
          </button>
        </div>
      </form>
    </div>
  );
}
