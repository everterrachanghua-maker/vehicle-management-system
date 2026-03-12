import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function LogForm({ vehicles, onSuccess }: any) {
  const [type, setType] = useState('odo'); // odo: 里程, fuel: 加油, service: 保養

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const vId = e.target.vehicle.value;
    const val = Number(e.target.value.value);
    
    // 1. 存入紀錄表
    await addDoc(collection(db, "records"), {
      vehicleId: vId,
      type: type,
      value: val,
      date: e.target.date.value,
      notes: e.target.notes.value,
      created_at: serverTimestamp()
    });

    // 2. 如果是里程或加油，同步更新車輛的主里程
    if (type !== 'service') {
      await updateDoc(doc(db, "vehicles", vId), { current_odo: val });
    }

    alert("紀錄成功！");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-[32px] border shadow-sm">
      <h2 className="text-xl font-bold text-center">記一筆資料</h2>
      
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        {[['odo','里程'],['fuel','加油'],['service','保養']].map(([k, v]) => (
          <button key={k} type="button" onClick={() => setType(k)} className={`flex-1 py-2 rounded-xl text-sm font-bold ${type === k ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>
            {v}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <select name="vehicle" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold" required>
          <option value="">選擇車輛</option>
          {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>)}
        </select>

        <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none" required />
        
        <div className="relative">
          <input name="value" type="number" placeholder={type === 'fuel' ? "加了幾公升？" : "目前的里程數？"} className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none text-xl font-bold" required />
          <span className="absolute right-4 top-4 font-bold text-slate-300">{type === 'fuel' ? 'L' : 'km'}</span>
        </div>

        <input name="notes" placeholder="備註 (選填)" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none" />
      </div>

      <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200">儲存紀錄</button>
    </form>
  );
}
