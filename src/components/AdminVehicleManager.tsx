import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  Car, Hash, Gauge, ChevronDown, ChevronUp, Fuel, 
  Droplets, Trash2, Edit3, Save, X, PlusCircle 
} from 'lucide-react';

export default function AdminVehicleManager() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 1. 監聽數據 (實時同步)
  useEffect(() => {
    const unsubV = onSnapshot(collection(db, "vehicles"), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubR = onSnapshot(query(collection(db, "records"), orderBy("createdAt", "desc")), (snap) => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubV(); unsubR(); };
  }, []);

  // 2. 新增車輛邏輯
  const handleAddVehicle = async (e: any) => {
    e.preventDefault();
    const name = e.target.name.value;
    const plate = e.target.plate.value.toUpperCase();
    const odo = Number(e.target.odo.value);

    try {
      await addDoc(collection(db, "vehicles"), {
        name,
        plate,
        initialOdo: odo,
        current_odo: odo, // 初始總里程
        status: 'available'
      });
      e.target.reset();
      alert("車輛資產已新增");
    } catch (err) { alert("新增失敗"); }
  };

  // 3. 刪除紀錄邏輯
  const handleDeleteRecord = async (recId: string) => {
    if (confirm("確定要刪除這筆填報紀錄嗎？這不會更改目前車輛里程。")) {
      await deleteDoc(doc(db, "records", recId));
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* --- 頂部：管理員新增車輛區 --- */}
      <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <PlusCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">新增車輛資產</h2>
        </div>
        
        <form onSubmit={handleAddVehicle} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <InputGroup label="車名/型號" name="name" placeholder="Toyota Cross" />
          <InputGroup label="車牌號碼" name="plate" placeholder="RFY-9731" />
          <InputGroup label="最初里程 (KM)" name="odo" type="number" placeholder="0" />
          <button className="bg-[#0f172a] text-white h-[52px] rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            確認入庫
          </button>
        </form>
      </section>

      {/* --- 中間：車輛資產管理清單 --- */}
      <section className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50">
          <h3 className="font-bold text-slate-500 text-sm uppercase tracking-widest">車輛資產清單與出勤細節</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 w-12"></th>
                <th className="px-4 py-4">車名 / 車牌</th>
                <th className="px-4 py-4 text-center">最初里程</th>
                <th className="px-4 py-4 text-center">目前總里程</th>
                <th className="px-4 py-4 text-center">已行駛公里</th>
                <th className="px-4 py-4 text-center">狀態</th>
                <th className="px-6 py-4 text-right">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map(v => {
                const isExpanded = expandedId === v.id;
                const vRecords = records.filter(r => r.vehicleId === v.id);
                const totalDriven = (v.current_odo || 0) - (v.initialOdo || 0);

                return (
                  <React.Fragment key={v.id}>
                    {/* 車輛主列 */}
                    <tr className={`hover:bg-slate-50 transition-colors group ${isExpanded ? 'bg-emerald-50/30' : ''}`}>
                      <td className="px-6 py-5">
                        <button onClick={() => setExpandedId(isExpanded ? null : v.id)} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200">
                          {isExpanded ? <ChevronUp size={16} className="text-emerald-500" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-5">
                        <p className="font-bold text-slate-800">{v.name}</p>
                        <p className="text-xs font-mono font-bold text-slate-400">{v.plate}</p>
                      </td>
                      <td className="px-4 py-5 text-center font-mono text-slate-500">{v.initialOdo?.toLocaleString()}</td>
                      <td className="px-4 py-5 text-center font-mono font-black text-slate-800">{v.current_odo?.toLocaleString()}</td>
                      <td className="px-4 py-5 text-center">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">
                          +{totalDriven.toLocaleString()} km
                        </span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <select 
                          value={v.status}
                          onChange={async (e) => await updateDoc(doc(db, "vehicles", v.id), { status: e.target.value })}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border-none outline-none cursor-pointer ${v.status === 'available' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                        >
                          <option value="available">可填寫</option>
                          <option value="maintenance">維修中</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={async () => {if(confirm("確定刪除？")) await deleteDoc(doc(db, "vehicles", v.id))}} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>

                    {/* 下拉展開：該車的所有填報紀錄 */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0 bg-slate-50/50 border-b">
                          <div className="m-6 bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">填報歷史紀錄</span>
                            </div>
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50/50 text-slate-400 font-bold border-b">
                                <tr>
                                  <th className="px-6 py-3">日期</th>
                                  <th className="px-6 py-3">填報人</th>
                                  <th className="px-6 py-3 text-center">里程 (起 → 止)</th>
                                  <th className="px-6 py-3 text-center">本次公里</th>
                                  <th className="px-6 py-3 text-center">維護項目</th>
                                  <th className="px-6 py-3 text-right">操作</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {vRecords.length === 0 ? (
                                  <tr><td colSpan={6} className="p-8 text-center text-slate-300 italic">尚無填報數據</td></tr>
                                ) : (
                                  vRecords.map(rec => (
                                    <tr key={rec.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 text-slate-500 font-mono">{rec.date}</td>
                                      <td className="px-6 py-4 font-bold text-slate-700">{rec.userName}</td>
                                      <td className="px-6 py-4 text-center font-mono">
                                        <span className="text-slate-400">{rec.startOdo}</span>
                                        <span className="mx-2 text-slate-300">→</span>
                                        <span className="font-bold text-indigo-600">{rec.endOdo}</span>
                                      </td>
                                      <td className="px-6 py-4 text-center font-black text-emerald-600">
                                        {rec.mileageDiff} km
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                          {rec.hasFuel && <Fuel size={14} className="text-orange-500" title="有加油" />}
                                          {rec.hasWash && <Droplets size={14} className="text-blue-500" title="有洗車" />}
                                          {!rec.hasFuel && !rec.hasWash && <span className="text-slate-200">-</span>}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDeleteRecord(rec.id)} className="text-slate-300 hover:text-rose-400"><Trash2 size={14}/></button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// 輔助組件：輸入框
function InputGroup({ label, name, placeholder, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        name={name} 
        type={type} 
        placeholder={placeholder} 
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-emerald-500 font-bold transition-all" 
        required 
      />
    </div>
  );
}

import React from 'react';
