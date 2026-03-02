import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { Gauge, Calendar, User, AlertTriangle, CheckCircle2, X, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function OdometerModal({ vehicleId, onClose, onSuccess }: any) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [lastLog, setLastLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleId: vehicleId || '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    odometer: '',
    notes: '',
    reporter: '浩廷環境' // 實際應從 Auth 取得
  });

  // 1. 抓取車輛清單與該車最後里程
  useEffect(() => {
    const fetchInitData = async () => {
      const vSnap = await getDocs(collection(db, "vehicles"));
      const vList = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setVehicles(vList);

      if (formData.vehicleId) {
        const v = vList.find(x => x.id === formData.vehicleId);
        setSelectedVehicle(v);
        // 抓取該車最後一筆里程紀錄
        const lQuery = query(
          collection(db, `vehicles/${formData.vehicleId}/odometer_logs`),
          orderBy("odometer", "desc"),
          limit(1)
        );
        const lSnap = await getDocs(lQuery);
        if (!lSnap.empty) setLastLog(lSnap.docs[0].data());
      }
    };
    fetchInitData();
  }, [formData.vehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentOdo = Number(formData.odometer);
    const lastOdo = lastLog?.odometer || selectedVehicle?.initial_mileage || 0;

    // 規則檢查：不可小於最後一次里程
    if (currentOdo < lastOdo) {
      alert(`⚠️ 數據異常：輸入里程 (${currentOdo}) 低於上次紀錄 (${lastOdo})。請確認是否填錯。`);
      return;
    }

    setLoading(true);
    try {
      // A. 新增里程紀錄
      await addDoc(collection(db, `vehicles/${formData.vehicleId}/odometer_logs`), {
        ...formData,
        odometer: currentOdo,
        timestamp: serverTimestamp()
      });

      // B. 更新車輛主表的「目前里程」供統計使用
      await updateDoc(doc(db, "vehicles", formData.vehicleId), {
        current_odometer: currentOdo
      });

      alert("里程更新成功！");
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden">
        <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl"><Gauge size={20}/></div>
            <h3 className="text-xl font-bold text-slate-800">快速里程填報</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full"><X/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* 選車 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">派遣車輛</label>
            <select 
              disabled={!!vehicleId}
              className="w-full p-4 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500 font-bold"
              value={formData.vehicleId}
              onChange={e => setFormData({...formData, vehicleId: e.target.value})}
              required
            >
              <option value="">-- 請選擇車輛 --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>)}
            </select>
          </div>

          {/* 里程輸入 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">目前儀表總里程 (km)</label>
            <input 
              type="number" 
              placeholder="請輸入目前數值"
              className="w-full p-5 bg-indigo-50 border-2 border-indigo-100 rounded-3xl outline-none focus:border-indigo-500 text-2xl font-black text-indigo-700 font-mono"
              value={formData.odometer}
              onChange={e => setFormData({...formData, odometer: e.target.value})}
              required
            />
            {selectedVehicle && (
              <p className="text-[10px] text-slate-400 font-bold px-2 flex items-center gap-1">
                <Info size={12}/> 前次紀錄：{lastLog?.odometer || selectedVehicle.initial_mileage} km
              </p>
            )}
          </div>

          {/* 備註 (快速模式預設隱藏，若有需要可展開) */}
          <div className="pt-2">
            <input 
              placeholder="備註 (如：加油、保養、異常)" 
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-[28px] font-bold shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "儲存中..." : "確認提交里程"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
