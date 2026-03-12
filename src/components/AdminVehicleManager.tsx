import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, addDoc, onSnapshot, query, orderBy, 
  doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  Car, Hash, Gauge, ShieldCheck, ChevronDown, ChevronUp, 
  Fuel, Droplets, Trash2, Edit3, History, AlertTriangle 
} from 'lucide-react';

export default function AdminVehicleManager() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 實時監聽車輛與紀錄
  useEffect(() => {
    const unsubVehicles = onSnapshot(collection(db, "vehicles"), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubRecords = onSnapshot(query(collection(db, "records"), orderBy("createdAt", "desc")), (snap) => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubVehicles(); unsubRecords(); };
  }, []);

  // 2. 處理新增車輛
  const handleAddVehicle = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    const name = e.target.name.value;
    const plate = e.target.plate.value.toUpperCase();
    const initialOdo = Number(e.target.initialOdo.value);
    const status = e.target.status.value;

    try {
      await addDoc(collection(db, "vehicles"), {
        name, 
        plate, 
        initialOdo, 
        current_odo: initialOdo, 
        status, 
        createdAt: new Date()
      });
      e.target.reset();
      alert("車輛建立成功");
    } catch (err) {
      console.error(err);
      alert("建立失敗");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // 3. 修改車輛狀態 (可用/維修中)
  const toggleStatus = async (v: any) => {
    const newStatus = v.status === 'available' ? 'maintenance' : 'available';
    await updateDoc(doc(db, "vehicles", v.id), { status: newStatus });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* --- 頂部：新增車輛表單 --- */}
      <form onSubmit={handleAddVehicle} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Car size={20}/></div>
          <h2 className="text-xl font-bold text-slate-800">車輛資產管理</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <InputGroup label="車名/型號" name="name" placeholder="例如：Toyota Cross" icon={<Car size={14}/>} />
          <InputGroup label="車牌號碼" name="plate" placeholder="ABC-1234" icon={<Hash size={14}/>} />
          <InputGroup label="初始里程 (KM)" name="initialOdo" type="number" placeholder="0" icon={<Gauge size={14}/>} />
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 px-1">
              <ShieldCheck size={14}/> 初始狀態
            </label>
            <select name="status" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 ring-indigo-500 transition-all">
              <option value="available">可預約 (Available)</option>
              <option value="maintenance">維修中 (Maintenance)</option>
            </select>
          </div>
        </div>

        <button 
          disabled={isSubmitting} 
          className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          {isSubmitting ? '處理中...' : '儲存車輛資料'}
        </button>
      </form>

      {/* --- 下方：車輛列表 --- */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-4 w-10"></th>
                <th className="px-4 py-4">車名/型號</th>
                <th className="px-4 py-4 text-center">車牌</th>
                <th className="px-4 py-4 text-center">初始里程</th>
                <th className="px-4 py-4 text-center">總行駛里程 (公司累積)</th>
                <th className="px-4 py-4 text-center">狀態</th>
                <th className="px-8 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map(v => {
                const vLogs = records.filter(r => r.vehicleId === v.id);
                // 計算公司累計里程 (所有行程差值之和)
                const totalDriven = vLogs.reduce((acc, curr) => acc + (curr.mileageDiff || 0), 0);
                const isExpanded = expandedId === v.id;

                return (
                  <React.Fragment key={v.id}>
                    {/* 車輛主列 */}
                    <tr className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/30' : ''}`} onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                      <td className="px-8 py-6">
                        {isExpanded ? <ChevronUp size={18} className="text-indigo-600"/> : <ChevronDown size={18} className="text-slate-300"/>}
                      </td>
                      <td className="px-4 py-6 font-bold text-slate-700">{v.name}</td>
                      <td className="px-4 py-6 text-center font-mono text-slate-400 font-bold">{v.plate}</td>
                      <td className="px-4 py-6 text-center text-slate-400 font-mono">{v.initialOdo?.toLocaleString()} km</td>
                      <td className="px-4 py-6 text-center font-black text-indigo-600 font-mono">+{totalDriven.toLocaleString()} km</td>
                      <td className="px-4 py-6 text-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleStatus(v); }}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                            v.status === 'available' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}
                        >
                          {v.status === 'available' ? '可預約' : '維修中'}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-right space-x-3 text-slate-300">
                        <button onClick={(e) => { e.stopPropagation(); alert("編輯功能開發中"); }} className="hover:text-indigo-600 transition-colors"><Edit3 size={18}/></button>
                        <button 
                          onClick={async (e) => { 
                            e.stopPropagation(); 
                            if(confirm(`確定要刪除車輛 ${v.name} 嗎？此動作無法復原。`)) await deleteDoc(doc(db, "vehicles", v.id)); 
                          }} 
                          className="hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </tr>

                    {/* 展開的出勤紀錄清單 */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
                          <div className="bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden">
                            <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
                               <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                 <History size={16} className="text-indigo-500"/> 出勤歷史紀錄
                               </h3>
                               <div className="text-[10px] font-bold text-slate-400 uppercase">
                                 共 {vLogs.length} 筆資料
                               </div>
                            </div>
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-400 font-bold uppercase border-b">
                                <tr>
                                  <th className="px-6 py-3">日期</th>
                                  <th className="px-6 py-3">填報人員</th>
                                  <th className="px-6 py-3 text-center">里程區間 (起→止)</th>
                                  <th className="px-6 py-3 text-center">單次行程</th>
                                  <th className="px-6 py-3 text-center">加油/洗車</th>
                                  <th className="px-6 py-3 text-right">操作</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {vLogs.length === 0 ? (
                                  <tr><td colSpan={6} className="p-10 text-center text-slate-300 italic">尚未有行駛紀錄</td></tr>
                                ) : (
                                  vLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 text-slate-500 font-mono">{log.date}</td>
                                      <td className="px-6 py-4 font-bold text-slate-700">{log.userName}</td>
                                      <td className="px-6 py-4 text-center">
                                        <span className="text-slate-400 font-mono">{log.startOdo}</span>
                                        <span className="mx-2 text-slate-300">→</span>
                                        <span className="text-indigo-600 font-mono font-bold">{log.endOdo}</span>
                                      </td>
                                      <td className="px-6 py-4 text-center font-black text-indigo-600">{log.mileageDiff} km</td>
                                      <td className="px-6 py-4 text-center flex justify-center gap-3">
                                        {log.hasFuel ? <Fuel size={16} className="text-orange-500" title="有加油"/> : <span className="text-slate-200">-</span>}
                                        {log.hasWash ? <Droplets size={16} className="text-blue-500" title="有洗車"/> : <span className="text-slate-200">-</span>}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <button className="text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={14}/></button>
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
      </div>
    </div>
  );
}

// 小組件：輸入框組 (InputGroup)
function InputGroup({ label, name, placeholder, type = "text", icon }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2 px-1">
        {icon} {label}
      </label>
      <input 
        name={name} 
        type={type} 
        placeholder={placeholder} 
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 font-bold transition-all placeholder:text-slate-300 text-sm" 
        required 
      />
    </div>
  );
}
