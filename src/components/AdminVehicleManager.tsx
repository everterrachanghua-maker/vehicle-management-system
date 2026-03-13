import React, { useState, useEffect } from 'react';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  collection, addDoc, onSnapshot, query, orderBy, 
  doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  Car, Hash, Gauge, ChevronDown, ChevronUp, Fuel, 
  Droplets, Trash2, Edit3, Camera, Loader2, PlusCircle, X, Save, FileText 
} from 'lucide-react';

export default function AdminVehicleManager() {
  // --- 狀態管理 ---
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 編輯與預覽狀態
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  // --- 輔助功能：里程背景顏色判定 ---
  const getRowBgColor = (current: number, contract: number) => {
    if (!contract || contract === 0) return "bg-white hover:bg-slate-50";
    const ratio = current / contract;
    if (ratio >= 1) return "bg-red-50 hover:bg-red-100/80";     // 100% 以上：淺紅
    if (ratio >= 0.9) return "bg-orange-50 hover:bg-orange-100/80"; // 90% 以上：淺橘
    if (ratio >= 0.7) return "bg-amber-50 hover:bg-amber-100/80";   // 70% 以上：淺黃
    return "bg-white hover:bg-slate-50"; // 正常
  };

  // --- 輔助功能：圖片壓縮 (優化儲存空間與上傳速度) ---
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 1024;
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => { if (blob) resolve(blob); }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  // --- 處理檔案選擇並產生預覽 ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const closeEditModal = () => {
    setEditingVehicle(null);
    setPreviewUrl(null);
  };

  // 2. 新增車輛邏輯
  const handleAddVehicle = async (e: any) => {
    e.preventDefault();
    setIsUploading(true);
    const name = e.target.name.value;
    const plate = e.target.plate.value.toUpperCase();
    const odo = Number(e.target.odo.value);
    const contractOdo = Number(e.target.contractOdo.value) || 0;
    const photoFile = e.target.photo.files[0];

    try {
      let imgUrl = "";
      if (photoFile) {
        const compressedBlob = await compressImage(photoFile);
        const storageRef = ref(storage, `vehicle_photos/${plate}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, compressedBlob);
        imgUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "vehicles"), {
        name, plate, initialOdo: odo, current_odo: odo, contractOdo,
        status: 'available', imgUrl, createdAt: new Date()
      });
      e.target.reset();
      alert("車輛資產已成功入庫！");
    } catch (err) { alert("新增失敗"); } finally { setIsUploading(false); }
  };

  // 3. 更新車輛資料邏輯 (整合壓縮與預覽)
  const handleUpdateVehicle = async (e: any) => {
    e.preventDefault();
    setIsUpdating(true);
    const { id, name, plate, initialOdo, contractOdo, imgUrl } = editingVehicle;
    const newPhotoFile = e.target.edit_photo?.files[0];

    try {
      let finalImgUrl = imgUrl;
      if (newPhotoFile) {
        const compressedBlob = await compressImage(newPhotoFile);
        const storageRef = ref(storage, `vehicle_photos/${plate}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, compressedBlob);
        finalImgUrl = await getDownloadURL(storageRef);
      }
      
      await updateDoc(doc(db, "vehicles", id), {
        name, plate: plate.toUpperCase(), 
        initialOdo: Number(initialOdo), 
        contractOdo: Number(contractOdo),
        imgUrl: finalImgUrl
      });
      closeEditModal();
      alert("車輛資料已成功更新！");
    } catch (err) { alert("更新失敗"); } finally { setIsUpdating(false); }
  };

  const handleDeleteRecord = async (recId: string) => {
    if (confirm("確定要刪除這筆填報紀錄嗎？")) await deleteDoc(doc(db, "records", recId));
  };

  return (
    <div className="space-y-8 pb-20">
      {/* --- 頂部：新增車輛區 --- */}
      <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><PlusCircle size={24} /></div>
          <h2 className="text-xl font-bold text-slate-800">資產入庫設定</h2>
        </div>
        <form onSubmit={handleAddVehicle} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">車輛縮圖</label>
            <div className="relative group">
              <input name="photo" type="file" accept="image/*" className="hidden" id="vehicle-photo" />
              <label htmlFor="vehicle-photo" className="flex items-center justify-center h-[52px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer group-hover:border-emerald-500 transition-all"><Camera size={20} className="text-slate-400 group-hover:text-emerald-500" /></label>
            </div>
          </div>
          <InputGroup label="車名/型號" name="name" placeholder="Toyota Cross" />
          <InputGroup label="車牌號碼" name="plate" placeholder="ABC-1234" />
          <InputGroup label="最初里程" name="odo" type="number" placeholder="0" />
          <InputGroup label="合約里程" name="contractOdo" type="number" placeholder="20000" />
          <button disabled={isUploading} className="bg-[#0f172a] text-white h-[52px] rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center disabled:opacity-70">
            {isUploading ? <Loader2 className="animate-spin" /> : "確認入庫"}
          </button>
        </form>
      </section>

      {/* --- 中間：資產清單 --- */}
      <section className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-500 text-sm uppercase tracking-widest">車輛資產管理清單</h3>
          <div className="flex gap-4 text-[10px] font-bold">
             <span className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-200 rounded-full"></div> 70% 警告</span>
             <span className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-200 rounded-full"></div> 90% 嚴重</span>
             <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-200 rounded-full"></div> 100% 超標</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 w-12 text-center">細節</th>
                <th className="px-4 py-4 w-16">縮圖</th>
                <th className="px-4 py-4">車名 / 車牌</th>
                <th className="px-4 py-4 text-center">最初里程</th>
                <th className="px-4 py-4 text-center">目前總里程</th>
                <th className="px-4 py-4 text-center">合約里程</th>
                <th className="px-4 py-4 text-center">狀態</th>
                <th className="px-6 py-4 text-right">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map(v => {
                const isExpanded = expandedId === v.id;
                const vRecords = records.filter(r => r.vehicleId === v.id);
                const rowBgColor = getRowBgColor(v.current_odo || 0, v.contractOdo || 0);

                return (
                  <React.Fragment key={v.id}>
                    <tr className={`${rowBgColor} transition-colors duration-300 group`}>
                      <td className="px-6 py-5">
                        <button onClick={() => setExpandedId(isExpanded ? null : v.id)} className="p-2 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200">
                          {isExpanded ? <ChevronUp size={16} className="text-emerald-500" /> : <ChevronDown size={16} className="text-slate-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-5">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                           {v.imgUrl ? <img src={v.imgUrl} className="w-full h-full object-cover" /> : <Car size={20} className="m-auto mt-3 text-slate-200"/>}
                        </div>
                      </td>
                      <td className="px-4 py-5 font-bold text-slate-800">{v.name}<p className="text-xs font-mono font-bold text-slate-400">{v.plate}</p></td>
                      <td className="px-4 py-5 text-center font-mono text-slate-500 text-xs">{v.initialOdo?.toLocaleString()}</td>
                      <td className="px-4 py-5 text-center font-mono font-black text-slate-800 text-sm">{v.current_odo?.toLocaleString()}</td>
                      <td className="px-4 py-5 text-center font-bold text-indigo-600 text-sm">{v.contractOdo ? `${v.contractOdo.toLocaleString()} km` : '--'}</td>
                      <td className="px-4 py-5 text-center">
                        <select 
                          value={v.status} 
                          onChange={async (e) => await updateDoc(doc(db, "vehicles", v.id), { status: e.target.value })} 
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border-none outline-none cursor-pointer transition-colors ${v.status === 'available' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                        >
                          <option value="available">可填寫</option>
                          <option value="maintenance">維修中</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 text-right space-x-2 text-slate-300">
                        <button onClick={() => setEditingVehicle(v)} className="p-2 hover:bg-white hover:text-emerald-600 rounded-lg transition-all"><Edit3 size={16} /></button>
                        <button onClick={async () => {if(confirm("確定刪除此車輛？")) await deleteDoc(doc(db, "vehicles", v.id))}} className="p-2 hover:bg-white hover:text-rose-500 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </td>
                    </tr>

                    {/* 下拉展開：紀錄細節 */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-0 bg-slate-50/50 border-b">
                          <div className="m-6 bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 text-slate-400 font-bold border-b">
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
                                  <tr><td colSpan={7} className="p-8 text-center text-slate-300 italic">尚無行駛紀錄</td></tr>
                                ) : (
                                  vRecords.map(rec => (
                                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4"><p className="font-bold text-slate-700">{rec.date}</p><p className="text-[10px] text-slate-400 font-mono">{rec.time || '--:--'}</p></td>
                                      <td className="px-6 py-4 font-bold text-slate-700">{rec.userName}</td>
                                      <td className="px-6 py-4 text-center"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-bold text-[10px]">{rec.location || '未標註'}</span></td>
                                      <td className="px-6 py-4 text-center font-mono text-[11px]"><span className="text-slate-400">{rec.startOdo}</span> → <span className="font-black text-indigo-600">{rec.endOdo}</span></td>
                                      <td className="px-6 py-4 text-center font-black text-emerald-600">{rec.mileageDiff} <span className="text-[9px] font-normal text-slate-400 uppercase">km</span></td>
                                      <td className="px-6 py-4 text-center">{rec.hasAbnormality ? <span className="text-rose-500 font-black text-[10px] border border-rose-200 bg-rose-50 px-2 py-0.5 rounded-md">異常</span> : <span className="text-emerald-500 font-bold text-[10px]">正常</span>}</td>
                                      <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteRecord(rec.id)} className="text-slate-300 hover:text-rose-400"><Trash2 size={14}/></button></td>
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

      {/* --- 編輯彈窗 (整合新給的預覽與壓縮功能) --- */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateVehicle} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-[#0f172a] text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">編輯車輛資訊</h3>
              <button type="button" onClick={closeEditModal} className="p-2 hover:bg-white/10 rounded-full"><X size={24}/></button>
            </div>

            <div className="p-8 space-y-6">
              {/* 圖片預覽區 */}
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-[32px] bg-slate-50 border-2 border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                    {previewUrl ? (
                      <img src={previewUrl} className="w-full h-full object-cover animate-in fade-in" />
                    ) : editingVehicle.imgUrl ? (
                      <img src={editingVehicle.imgUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Car size={48} className="text-slate-200" />
                    )}
                  </div>
                  <label htmlFor="edit_photo" className="absolute -bottom-2 -right-2 w-11 h-11 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg cursor-pointer hover:bg-emerald-600 transition-all border-4 border-white active:scale-90">
                    <Camera size={20} />
                  </label>
                  <input name="edit_photo" type="file" accept="image/*" className="hidden" id="edit_photo" onChange={handleFileChange} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {previewUrl ? "已選取新照片 (待儲存)" : "點擊相機更換照片"}
                </p>
              </div>

              <div className="space-y-4">
                <InputGroup label="車名/型號" value={editingVehicle.name} onChange={(e:any)=>setEditingVehicle({...editingVehicle, name: e.target.value})} />
                <InputGroup label="車牌號碼" value={editingVehicle.plate} onChange={(e:any)=>setEditingVehicle({...editingVehicle, plate: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="初始里程" type="number" value={editingVehicle.initialOdo} onChange={(e:any)=>setEditingVehicle({...editingVehicle, initialOdo: e.target.value})} />
                  <InputGroup label="合約里程" type="number" value={editingVehicle.contractOdo} onChange={(e:any)=>setEditingVehicle({...editingVehicle, contractOdo: e.target.value})} />
                </div>
              </div>

              <button 
                disabled={isUpdating}
                className="w-full bg-emerald-600 text-white py-5 rounded-[24px] font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 mt-4 disabled:bg-slate-300"
              >
                {isUpdating ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <><Save size={24} /> 儲存變更</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// 輔助組件：輸入框群組
function InputGroup({ label, name, placeholder, type = "text", value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        name={name} type={type} placeholder={placeholder} value={value} onChange={onChange}
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-emerald-500 font-bold transition-all placeholder:text-slate-300 text-sm" 
        required 
      />
    </div>
  );
}
