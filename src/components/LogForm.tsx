import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function LogForm({ vehicles, onSuccess }: any) {
  const [type, setType] = useState('odo'); // odo: 里程, fuel: 加油, service: 保養

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const vId = e.target.vehicle.value;
    const val = Number(e.target.value.value);
    const date = e.target.date.value;
    const notes = e.target.notes.value;

    if (!vId) return alert("請選擇車輛");

    try {
      // 1. 存入紀錄
      await addDoc(collection(db, "records"), {
        vehicleId: vId,
        type: type,
        value: val,
        date: date,
        notes: notes,
        createdAt: serverTimestamp()
      });

      // 2. 如果是里程或加油，更新車輛目前里程
      if (type === 'odo' || type === 'fuel') {
        await updateDoc(doc(db, "vehicles", vId), { current_odo: val });
      }

      alert("紀錄已儲存！");
      onSuccess();
    } catch (err) {
      alert("儲存失敗，請檢查網路");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-center">新增紀錄</h2>
      
      {/* 類型切換 */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        {[['odo','里程'],['fuel','加油'],['service','保養']].map(([k, v]) => (
          <button 
            key={k} type="button" onClick={() => setType(k)} 
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${type === k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <select name="vehicle" className="w-full p-3 bg-slate-50 border rounded-xl font-bold" required>
          <option value="">-- 選擇車輛 --</option>
          {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>)}
        </select>

        <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-50 border rounded-xl" required />
        
        <div className="relative">
          <input name="value" type="number" placeholder={type === 'fuel' ? "加油後里程？" : "目前的里程數？"} className="w-full p-4 bg-slate-50 border rounded-2xl text-xl font-bold" required />
          <span className="absolute right-4 top-4 font-bold text-slate-300">km</span>
        </div>

        <input name="notes" placeholder="備註 (如：加油 $1200 / 定期保養)" className="w-full p-3 bg-slate-50 border rounded-xl" />
      </div>

      <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg">儲存紀錄</button>
    </form>
  );
}
