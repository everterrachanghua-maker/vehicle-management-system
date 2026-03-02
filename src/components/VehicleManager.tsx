import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
// 修正後的匯入清單，包含 onSnapshot
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  updateDoc, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { 
  Car, Hash, Settings, Users, Fuel, 
  Wrench, ShieldCheck, AlertCircle, Plus, 
  Search, Trash2, Edit3, MoreVertical, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function VehicleManager() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. 抓取車輛清單 (實時同步版本)
  useEffect(() => {
    const q = query(collection(db, "vehicles"), orderBy("created_at", "desc"));
    
    // 使用 onSnapshot 監聽資料庫變化
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehicleData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setVehicles(vehicleData);
      setLoading(false);
    }, (error) => {
      console.error("監聽失敗:", error);
      setLoading(false);
    });

    // 元件卸載時停止監聽
    return () => unsubscribe();
  }, []);

  const filteredVehicles = vehicles.filter(v => 
    v.plate?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 頂部操作列 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜尋車牌或車名..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} /> 新增車輛資料
        </button>
      </div>

      {/* 車輛清單網格 */}
      {loading ? (
        <div className="p-20 text-center text-slate-400">載入車庫資料中...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
          {filteredVehicles.length === 0 && !loading && (
            <div className="col-span-full p-20 text-center text-slate-300">
              找不到符合條件的車輛
            </div>
          )}
        </div>
      )}

      {/* 新增車輛彈窗 */}
      <AnimatePresence>
        {showModal && <VehicleFormModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

// 車輛卡片元件
function VehicleCard({ vehicle }: { vehicle: any }) {
  const handleDelete = async () => {
    if (confirm(`確定要報廢/移除車輛 ${vehicle.name} 嗎？此動作不可逆。`)) {
      try {
        await deleteDoc(doc(db, "vehicles", vehicle.id));
      } catch (err) {
        console.error("刪除失敗:", err);
        alert("刪除失敗，請檢查權限");
      }
    }
  };

  const statusColors: any = {
    'available': 'bg-emerald-500',
    'maintenance': 'bg-amber-500',
    'disabled': 'bg-slate-400'
  };

  const statusText: any = {
    'available': '可用',
    'maintenance': '保養中',
    'disabled': '停用'
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColors[vehicle.status] || 'bg-slate-400'}`}></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{statusText[vehicle.status]}</span>
          </div>
          <button onClick={handleDelete} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="bg-slate-100 p-4 rounded-2xl text-slate-600">
            <Car size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{vehicle.name}</h3>
            <p className="text-sm font-mono text-indigo-600 font-bold tracking-tighter">{vehicle.plate}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Fuel size={10}/> 油種</p>
            <p className="text-sm font-semibold">{vehicle.fuelType}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Users size={10}/> 座位</p>
            <p className="text-sm font-semibold">{vehicle.seats} 人座</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-6 border-t border-slate-100 space-y-3">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400 font-medium">下次保養里程</span>
          <span className="font-mono font-bold text-slate-700">{(vehicle.nextServiceMileage || 0).toLocaleString()} km</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-indigo-500 h-full w-[70%]" />
        </div>
        <div className="flex justify-between text-[10px] pt-2">
            <span className="text-slate-400 flex items-center gap-1"><ShieldCheck size={12}/> 保險: {vehicle.insuranceExpiry || '未設定'}</span>
            <span className="text-slate-400 flex items-center gap-1"><AlertCircle size={12}/> 驗車: {vehicle.inspectionDate || '未設定'}</span>
        </div>
      </div>
    </motion.div>
  );
}

// 新增車輛的彈窗表單
function VehicleFormModal({ onClose }: { onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    plate: '',
    name: '',
    type: '一般轎車',
    seats: 5,
    fuelType: '95 無鉛',
    status: 'available',
    nextServiceMileage: 10000,
    insuranceExpiry: '',
    inspectionDate: '',
    owner: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const plateUpper = formData.plate.toUpperCase();

    // 檢查車牌唯一性
    const q = query(collection(db, "vehicles"), where("plate", "==", plateUpper));
    const snap = await getDocs(q);
    if (!snap.empty) {
      alert("⚠️ 錯誤：此車牌已存在系統中！");
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, "vehicles"), {
        ...formData,
        plate: plateUpper,
        created_at: serverTimestamp()
      });
      onClose();
    } catch (err) {
      console.error("建立失敗:", err);
      alert("儲存失敗，請檢查網路連線");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
          <h3 className="text-2xl font-bold text-slate-800">車輛基本資料設定</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Hash size={14}/> 車牌號碼 *</label>
            <input required placeholder="例: ABC-1234" className="w-full p-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
          </div>
          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Car size={14}/> 車輛名稱/代號 *</label>
            <input required placeholder="例: 採樣 1 號車" className="w-full p-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">車種類別</label>
            <select className="w-full p-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option>一般轎車</option><option>SUV 休旅車</option><option>3.5噸 貨車</option><option>九人座客車</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">目前狀態</label>
            <select className="w-full p-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="available">可用 (Available)</option>
              <option value="maintenance">保養維修中 (Maintenance)</option>
              <option value="disabled">已報廢/停用 (Disabled)</option>
            </select>
          </div>

          <div className="col-span-2 border-t pt-6 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Wrench size={14}/> 下次保養里程 (km)</label>
              <input type="number" className="w-full p-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500" value={formData.nextServiceMileage} onChange={e => setFormData({...formData, nextServiceMileage: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> 保險到期日</label>
              <input type="date" className="w-full p-3 bg-slate-100 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-500" value={formData.insuranceExpiry} onChange={e => setFormData({...formData, insuranceExpiry: e.target.value})} />
            </div>
          </div>

          <div className="col-span-2 flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-500">取消返回</button>
            <button disabled={isSubmitting} type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-3xl font-bold shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all">
              {isSubmitting ? "建立中..." : "確認新增車輛"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
