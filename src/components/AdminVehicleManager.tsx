import React, { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  collection, addDoc, onSnapshot, query, orderBy, 
  doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  Car, Hash, Gauge, ChevronDown, ChevronUp, Fuel, 
  Droplets, Trash2, Edit3, Camera, Loader2, PlusCircle, X, Save 
} from 'lucide-react';

export default function AdminVehicleManager() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

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

  // 核心功能：處理圖片上傳
  const handleFileUpload = async (file: File, vehiclePlate: string) => {
    const storageRef = ref(storage, `vehicle_photos/${vehiclePlate}_${Date.now()}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // 2. 新增車輛邏輯
  const handleAddVehicle = async (e: any) => {
    e.preventDefault();
    setIsUploading(true);
    
    const name = e.target.name.value;
    const plate = e.target.plate.value.toUpperCase();
    const odo = Number(e.target.odo.value);
    const photoFile = e.target.photo.files[0];

    try {
      let imgUrl = "";
      if (photoFile) {
        imgUrl = await handleFileUpload(photoFile, plate);
      }

      await addDoc(collection(db, "vehicles"), {
        name,
        plate,
        initialOdo: odo,
        current_odo: odo,
        status: 'available',
        imgUrl: imgUrl || "",
        createdAt: new Date()
      });
      
      e.target.reset();
      alert("車輛資產已成功入庫！");
    } catch (err) {
      console.error(err);
      alert("新增失敗");
    } finally {
      setIsUploading(false);
    }
  };

  // 3. 更新車輛資料邏輯
  const handleUpdateVehicle = async (e: any) => {
    e.preventDefault();
    setIsUpdating(true);
    const { id, name, plate, initialOdo, imgUrl } = editingVehicle;
    const newPhotoFile = e.target.edit_photo?.files[0];

    try {
      let finalImgUrl = imgUrl;
      if (newPhotoFile) {
        finalImgUrl = await handleFileUpload(newPhotoFile, plate);
      }
      await updateDoc(doc(db, "vehicles", id), {
        name,
        plate: plate.toUpperCase(),
        initialOdo: Number(initialOdo),
        imgUrl: finalImgUrl
      });
      setEditingVehicle(null);
      alert("車輛資料已成功更新");
    } catch (err) {
      alert("更新失敗");
    } finally {
      setIsUpdating(false);
    }
  };

  // 4. 刪除紀錄邏輯
  const handleDeleteRecord = async (recId: string) => {
    if (confirm("確定要刪除這筆填報紀錄嗎？這不會更改目前車輛的總里程。")) {
      await deleteDoc(doc(db, "records", recId));
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* --- 頂部：新增車輛區 --- */}
      <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <PlusCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">資產入庫設定</h2>
        </div>
        
        <form onSubmit={handleAddVehicle} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">車輛縮圖</label>
            <div className="relative group">
              <input name="photo" type="file" accept="image/*" className="hidden" id="vehicle-photo" />
              <label htmlFor="vehicle-photo" className="flex items-center justify-center h-[52px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer group-hover:border-emerald-500 transition-all">
                <Camera size={20} className="text-slate-400 group-hover:text-emerald-500" />
              </label>
            </div>
          </div>
          <InputGroup label="車名/型號" name="name" placeholder="Toyota Cross" />
          <InputGroup label="車牌號碼" name="plate" placeholder="ABC-1234" />
          <InputGroup label="最初里程 (KM)" name="odo" type="number" placeholder="0" />
          <button disabled={isUploading} className={`bg-[#0f172a] text-white h-[52px] rounded-2xl font-bold transition-all shadow-lg shadow-slate-200 flex items-center justify-center ${isUploading ? 'opacity-70' : 'hover:bg-slate-800'}`}>
            {isUploading ? <Loader2 className="animate-spin" /> : "確認入庫"}
          </button>
        </form>
      </section>

      {/* --- 中間：資產清單 --- */}
      <section className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50">
          <h3 className="font-bold text-slate-500 text-sm uppercase tracking-widest">車輛資產清單與出勤細節</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 w-12 text-center">細節</th>
                <th className="px-4 py-4">縮圖</th>
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
                    <tr className={`hover:bg-slate-50 transition-colors group ${isExpanded ? 'bg-emerald-50/30' : ''}`}>
                      <td className="px-6 py-5">
                        <button onClick={() => setExpandedId(isExpanded ? null : v.id)} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200">
                          {isExpanded ? <ChevronUp size={16} className="text-emerald-500" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-5">
                        {v.imgUrl ? (
                          <img src={v.imgUrl} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm bg-slate-50" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300">
                            <Car size={20} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-5 font-bold text-slate-800">
                        {v.name}
                        <p className="text-xs font-mono font-bold text-slate-400">{v.plate}</p>
                      </td>
                      <td className="px-4 py-5 text-center font-mono text-slate-500">{v.initialOdo?.toLocaleString()}</td>
                      <td className="px-4 py-5 text-center font-mono font-black text-slate-800">{v.current_odo?.toLocaleString()}</td>
                      <td className="px-4 py-5 text-center font-black text-emerald-600">+{totalDriven.toLocaleString()} km</td>
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
                      <td className="px-6 py-5 text-right space-x-2 text-slate-300">
                        <button onClick={() => setEditingVehicle(v)} className="p-2 hover:bg-white hover:text-emerald-600 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={async () => {if(confirm("確定刪除此車輛？")) await deleteDoc(doc(db, "vehicles", v.id))}} className="p-2 hover:bg-white hover:text-rose-500 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>

                    {/* 下拉展開：該車的所有出勤填報細節 (優化後) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-0 bg-slate-50/50 border-b">
                          <div className="m-6 bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50/50 text-slate-400 font-bold border-b">
                                <tr>
                                  <th className="px-6 py-3">日期 / 時間</th>
                                  <th className="px-6 py-3">填報人</th>
                                  <th className="px-6 py-3 text-center">工作地點</th>
                                  <th className="px-6 py-3 text-center">里程 (起 → 止)</th>
                                  <th className="px-6 py-3 text-center">單次里程</th>
                                  <th className="px-6 py-3 text-center">狀況</th>
                                  <th className="px-6 py-3 text-right">操作</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {vRecords.length === 0 ? (
                                  <tr><td colSpan={7} className="p-8 text-center text-slate-300 italic">尚未有行駛紀錄</td></tr>
                                ) : (
                                  vRecords.map(rec => (
                                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4">
                                        <p className="font-bold text-slate-700">{rec.date}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{rec.time || '--:--'}</p>
                                      </td>
                                      <td className="px-6 py-4 font-bold text-slate-700">{rec.userName}</td>
                                      <td className="px-6 py-4 text-center">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-bold text-[10px]">
                                          {rec.location || '未標註'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 text-center font-mono text-[11px]">
                                        <span className="text-slate-400">{rec.startOdo}</span>
                                        <span className="mx-2 text-slate-300">→</span>
                                        <span className="font-black text-indigo-600">{rec.endOdo}</span>
                                      </td>
                                      <td className="px-6 py-4 text-center font-black text-emerald-600">
                                        {rec.mileageDiff} <span className="text-[9px] font-normal text-slate-400 uppercase">km</span>
                                      </td>
                                      <td className="px-6 py-4 text-center">
                                        {rec.hasAbnormality ? (
                                          <span className="text-rose-500 font-black text-[10px] border border-rose-200 bg-rose-50 px-2 py-0.5 rounded-md">
                                            異常
                                          </span>
                                        ) : (
                                          <span className="text-emerald-500 font-bold text-[10px]">正常</span>
                                        )}
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

      {/* --- 編輯彈窗 (Modal) --- */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateVehicle} className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#0f172a] text-white flex justify-between items-center">
              <h3 className="font-bold">編輯車輛資訊</h3>
              <button type="button" onClick={() => setEditingVehicle(null)} className="hover:text-slate-300"><X size={20}/></button>
            </div>
            
            <div className="p-8 space-y-4">
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
                    {editingVehicle.imgUrl ? (
                      <img src={editingVehicle.imgUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Car size={32} className="text-slate-200" />
                    )}
                  </div>
                  <label htmlFor="edit_photo" className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:bg-emerald-600 transition-all border-2 border-white">
                    <Camera size={14} />
                  </label>
                  <input name="edit_photo" type="file" accept="image/*" className="hidden" id="edit_photo" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">更換資產照片</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">車名/型號</label>
                <input value={editingVehicle.name} onChange={e => setEditingVehicle({...editingVehicle, name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">車牌號碼</label>
                <input value={editingVehicle.plate} onChange={e => setEditingVehicle({...editingVehicle, plate: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 font-mono font-bold" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">最初里程 (KM)</label>
                <input type="number" value={editingVehicle.initialOdo} onChange={e => setEditingVehicle({...editingVehicle, initialOdo: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 ring-emerald-500 font-mono" required />
              </div>
              
              <button 
                disabled={isUpdating}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 mt-4 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70"
              >
                {isUpdating ? <Loader2 className="animate-spin" /> : <><Save size={20} /> 儲存變更</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// 輔助組件
function InputGroup({ label, name, placeholder, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        name={name} 
        type={type} 
        placeholder={placeholder} 
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-emerald-500 font-bold transition-all placeholder:text-slate-300 text-sm" 
        required 
      />
    </div>
  );
}
