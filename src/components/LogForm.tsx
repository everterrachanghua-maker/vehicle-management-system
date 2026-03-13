import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function LogForm({ vehicle, user, onSuccess, onCancel }: any) {
  const [loading, setLoading] = useState(false);
  const [hasAbnormality, setHasAbnormality] = useState(false);

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

    // 自動獲取填報當下的時間 (24小時制)
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + 
                      now.getMinutes().toString().padStart(2, '0');

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
        time: currentTime, // 自動記錄時間
        startOdo,
        endOdo,
        mileageDiff: endOdo - startOdo,
        location,
        hasAbnormality,
        createdAt: serverTimestamp()
      });

      // 2. 更新車輛主表的最新里程
      await updateDoc(doc(db, "vehicles", vehicle.id), {
        current_odo: endOdo
      });

      alert("數據已成功送出！");
      onSuccess();
    } catch (err) {
      alert("儲存失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      {/* 返回按鈕 */}
      <button onClick={onCancel} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-6 font-bold transition-all group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回清單
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden">
        {/* 表頭區 */}
        <div className="p-8 bg-[#0f172a] text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black">里程與任務填報</h2>
            <p className="text-xs font-bold text-emerald-400 mt-1">{vehicle.name} / {vehicle.plate}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">填報人</p>
            <p className="text-sm font-bold">{user.name}</p>
          </div>
        </div>

        <div className="p-10 space-y-10">
          {/* 1. 里程區塊 */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">本次初始里程 (km)</label>
              <input 
                name="start_odo" 
                type="number" 
                defaultValue={vehicle.current_odo || 0}
                className="w-full p-5 bg-slate-50 rounded-3xl border-none text-xl font-black text-slate-400 outline-none cursor-not-allowed" 
                readOnly 
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">本次結束里程 (km)</label>
              <input 
                name="end_odo" 
                type="number" 
                placeholder="輸入目前讀數"
                className="w-full p-5 bg-emerald-50/50 rounded-3xl border-2 border-emerald-100 text-xl font-black text-emerald-700 outline-none focus:border-emerald-500 transition-all" 
                required 
              />
            </div>
          </div>

          {/* 2. 地點區塊 */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <MapPin size={12}/> 工作地點 (縣市)
            </label>
            <select 
              name="location"
              className="w-full p-5 bg-slate-50 rounded-3xl border-none text-lg font-bold text-slate-700 outline-none focus:ring-2 ring-emerald-500 cursor-pointer appearance-none"
              required
            >
              <option value="">-- 請選擇工作縣市 --</option>
              {taiwanCounties.map(county => <option key={county} value={county}>{county}</option>)}
            </select>
          </div>

          {/* 3. 異常回報區塊 */}
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
                className={`px-8 py-2.5 rounded-[15px] text-xs font-black transition-all ${hasAbnormality ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}
              >
                有異常
              </button>
            </div>

            {/* 異常提醒 */}
            {hasAbnormality && (
              <div className="bg-rose-50 border-2 border-rose-100 p-5 rounded-3xl flex items-center gap-4 animate-in zoom-in-95 duration-300">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-rose-700 font-black text-sm">請將異常情形通報車輛管理員</p>
                  <p className="text-rose-400 text-[10px] font-bold uppercase mt-0.5">Please report to admin</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. 送出按鈕 */}
        <div className="p-10 bg-slate-50/50 border-t border-slate-100">
          <button 
            disabled={loading}
            className="w-full bg-[#0f172a] text-white py-5 rounded-[24px] font-black text-lg shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-slate-300"
          >
            {loading ? "處理中..." : <><CheckCircle2 size={24}/> 確認送出填報數據</>}
          </button>
        </div>
      </form>
    </div>
  );
}
