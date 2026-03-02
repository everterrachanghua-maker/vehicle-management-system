import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore";
import { 
  Calendar, Clock, Car, Users, MapPin, 
  AlertTriangle, CheckCircle2, ChevronRight, X 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function ItineraryForm({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // 表單狀態
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    vehicleId: '',
    vehicleName: '',
    vehiclePlate: '',
    driver: '',
    staffNames: '', // 採樣人員（逗號分隔）
    projectName: '',
    destination: '',
    notes: ''
  });

  // 1. 抓取可用車輛清單
  useEffect(() => {
    const fetchVehicles = async () => {
      const snap = await getDocs(collection(db, "vehicles"));
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchVehicles();
  }, []);

  // 2. 衝突檢查邏輯 (核心功能)
  useEffect(() => {
    const checkConflict = async () => {
      if (!formData.vehicleId || !formData.date) return;

      setConflictWarning(null);
      const q = query(
        collection(db, "itineraries"),
        where("vehicleId", "==", formData.vehicleId),
        where("date", "==", formData.date)
      );

      const snap = await getDocs(q);
      const existingEvents = snap.docs.map(d => d.data());

      // 簡單的時間重疊判斷
      const hasOverlap = existingEvents.some((event: any) => {
        return (formData.startTime < event.endTime && formData.endTime > event.startTime);
      });

      if (hasOverlap) {
        setConflictWarning(`⚠️ 警告：該車輛在 ${formData.date} 的選定時段已有其他行程！`);
      }
    };

    const timer = setTimeout(checkConflict, 500); // 延遲檢查避免頻繁查詢
    return () => clearTimeout(timer);
  }, [formData.vehicleId, formData.date, formData.startTime, formData.endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictWarning && !confirm("偵測到時間衝突，確定要強制儲存嗎？")) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "itineraries"), {
        ...formData,
        staffNames: formData.staffNames.split(',').map(s => s.trim()),
        status: 'scheduled',
        created_at: serverTimestamp()
      });
      alert("行程排定成功！");
      onBack();
    } catch (err) {
      console.error(err);
      alert("儲存失敗，請檢查網路連線");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 頁首 */}
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium">
          <X size={20} /> 取消並返回
        </button>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
           <span>行程資訊</span> <ChevronRight size={14}/> <span className="font-bold text-slate-800">填寫表單</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左側：主要輸入區 */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Calendar size={20}/></div>
              <h3 className="font-bold text-lg">基本時程</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup label="日期" icon={<Calendar size={16}/>}>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-field" required />
              </FormGroup>
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="開始時間" icon={<Clock size={16}/>}>
                  <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="input-field" required />
                </FormGroup>
                <FormGroup label="結束時間" icon={<Clock size={16}/>}>
                  <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="input-field" required />
                </FormGroup>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 bg-sky-50 text-sky-600 rounded-lg"><Car size={20}/></div>
              <h3 className="font-bold text-lg">派車與人員</h3>
            </div>
            
            <div className="space-y-4">
              <FormGroup label="選擇車輛" icon={<Car size={16}/>}>
                <select 
                  className="input-field" 
                  required 
                  onChange={e => {
                    const v = vehicles.find(x => x.id === e.target.value);
                    setFormData({...formData, vehicleId: v.id, vehicleName: v.name, vehiclePlate: v.plate || ''});
                  }}
                >
                  <option value="">-- 請選擇車輛 --</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.plate})</option>)}
                </select>
              </FormGroup>

              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="駕駛員" icon={<Users size={16}/>}>
                  <input type="text" placeholder="輸入駕駛姓名" className="input-field" value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})} required />
                </FormGroup>
                <FormGroup label="採樣人員" icon={<Users size={16}/>}>
                  <input type="text" placeholder="多位請用逗號分隔" className="input-field" value={formData.staffNames} onChange={e => setFormData({...formData, staffNames: e.target.value})} />
                </FormGroup>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MapPin size={20}/></div>
              <h3 className="font-bold text-lg">任務地點</h3>
            </div>
            <FormGroup label="專案名稱 / 任務" icon={<CheckCircle2 size={16}/>}>
              <input type="text" placeholder="例如：115年彰化水質採樣" className="input-field" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} required />
            </FormGroup>
            <FormGroup label="目的地" icon={<MapPin size={16}/>}>
              <input type="text" placeholder="輸入地點或座標" className="input-field" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} required />
            </FormGroup>
          </section>
        </div>

        {/* 右側：側欄資訊與提交 */}
        <div className="space-y-6">
          <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
            <h3 className="font-bold text-xl border-b border-indigo-800 pb-4">預約檢查</h3>
            
            {/* 衝突警示 */}
            {conflictWarning ? (
              <div className="bg-rose-500/20 border border-rose-500/50 p-4 rounded-2xl flex gap-3 text-rose-100 text-sm">
                <AlertTriangle className="shrink-0" size={20} />
                <p>{conflictWarning}</p>
              </div>
            ) : (
              <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-2xl flex gap-3 text-emerald-100 text-sm">
                <CheckCircle2 className="shrink-0" size={20} />
                <p>目前時段可用，未偵測到衝突。</p>
              </div>
            )}

            <div className="space-y-4 pt-4 text-indigo-200 text-sm">
               <p className="flex justify-between"><span>預計日期</span> <span className="text-white font-mono">{formData.date}</span></p>
               <p className="flex justify-between"><span>車輛代號</span> <span className="text-white">{formData.vehicleName || '未選'}</span></p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-indigo-900 font-bold py-4 rounded-2xl shadow-lg hover:bg-indigo-50 transition-all disabled:opacity-50"
            >
              {loading ? "處理中..." : "確認並建立行程"}
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200">
             <h4 className="font-bold text-slate-700 mb-2 italic">小撇步</h4>
             <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                <li>選擇日期與車輛後，系統會自動檢查重疊行程。</li>
                <li>目的地可輸入關鍵字或專案編號。</li>
                <li>採樣人員名單將顯示於月曆詳細抽屜中。</li>
             </ul>
          </div>
        </div>
      </form>
    </div>
  );
}

// 輔助組件：輸入框容器
function FormGroup({ label, icon, children }: any) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
