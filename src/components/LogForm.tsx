import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function LogForm({ vehicles, onSuccess }: any) {
  const [type, setType] = useState('odo'); // odo, fuel, service

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const vId = e.target.vehicle.value;
    const val = Number(e.target.value.value);

    if (!vId) return alert("請選擇車輛");

    try {
      await addDoc(collection(db, "records"), {
        vehicleId: vId,
        type: type,
        value: val,
        date: e.target.date.value,
        notes: e.target.notes.value,
        createdAt: serverTimestamp()
      });

      if (type === 'odo' || type === 'fuel') {
        await updateDoc(doc(db, "vehicles", vId), { current_odo: val });
      }

      alert("紀錄儲存成功");
      onSuccess();
    } catch (err) {
      alert("儲存失敗");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-xl">
        {[['odo','里程'],['fuel','加油'],['service','保養']].map(([k, v]) => (
          <button key={k} type="button" onClick={() => setType(k)} className={`flex-1 py-2 rounded-lg text-xs font-bold ${type === k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
            {v}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        <select name="vehicle" className="w-full p-3 bg-slate-50 border rounded-xl" required>
          <option value="">選擇車輛</option>
          {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>)}
        </select>
        <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-50 border rounded-xl" required />
        <input name="value" type="number" placeholder={type === 'fuel' ? "加油後總里程？" : "目前的里程數？"} className="w-full p-4 bg-slate-50 border rounded-xl text-xl font-bold" required />
        <input name="notes" placeholder="備註 (選填)" className="w-full p-3 bg-slate-50 border rounded-xl" />
      </div>
      <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg">儲存紀錄</button>
    </form>
  );
}
