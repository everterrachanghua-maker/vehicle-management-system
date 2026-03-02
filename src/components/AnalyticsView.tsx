import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, Calendar, AlertTriangle, Download, 
  Activity, Car, ChevronRight, CheckCircle2 
} from 'lucide-react'; // 確保這裡有 Car
import { format, differenceInDays, parseISO } from 'date-fns';

export default function AnalyticsView() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vSnap = await getDocs(collection(db, "vehicles"));
        const iSnap = await getDocs(query(collection(db, "itineraries"), orderBy("date", "asc")));
        
        const vList = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const iList = iSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        setVehicles(vList);
        setItineraries(iList);

        // 安全計算使用率
        const usage = vList.map(v => ({
          name: v.name || '未命名',
          count: iList.filter(i => i.vehicleId === v.id).length
        }));
        setUsageData(usage);
      } catch (err) {
        console.error("抓取資料失敗:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 安全計算保養提醒 (加入 v.insuranceExpiry 存在檢查)
  const maintenanceAlerts = vehicles.filter(v => {
    if (!v.insuranceExpiry || v.insuranceExpiry === "") return false;
    try {
      const daysLeft = differenceInDays(parseISO(v.insuranceExpiry), new Date());
      return daysLeft < 30;
    } catch (e) {
      return false; 
    }
  });

  const exportToCSV = () => {
    if (itineraries.length === 0) return alert("尚無行程資料可匯出");
    const headers = "日期,時間,車輛,駕駛,地點,任務\n";
    const rows = itineraries.map(i => 
      `${i.date},${i.startTime},${i.vehicleName},${i.driver},${i.destination},${i.projectName}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `車輛行程報表_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.click();
  };

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold">數據統計中...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="總車輛數" value={vehicles.length} icon={<Car size={24}/>} trend="系統車庫" color="indigo" />
        <StatCard title="累積行程" value={itineraries.length} icon={<Calendar size={24}/>} trend="所有紀錄" color="emerald" />
        <StatCard title="待處理提醒" value={maintenanceAlerts.length} icon={<AlertTriangle size={24}/>} trend="30天內到期" color="rose" />
        
        <button 
          onClick={exportToCSV}
          className="bg-white p-6 rounded-[32px] border shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group"
        >
          <div className="p-3 bg-slate-100 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Download size={24} />
          </div>
          <span className="font-bold text-slate-700 text-sm">匯出報表 (CSV)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
            <Activity className="text-indigo-500" /> 車輛出勤頻率
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="text-rose-500" /> 證照到期提醒
          </h3>
          <div className="space-y-4">
            {maintenanceAlerts.length === 0 ? (
              <p className="text-slate-300 italic text-center py-10">目前無待處理事項</p>
            ) : (
              maintenanceAlerts.map(v => (
                <div key={v.id} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-rose-900">{v.name}</p>
                    <p className="text-[10px] text-rose-500 uppercase font-bold">{v.plate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-rose-700">保險即將到期</p>
                    <p className="text-[10px] text-rose-400">{v.insuranceExpiry}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="bg-white p-6 rounded-[32px] border shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>{icon}</div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trend}</span>
      </div>
      <p className="text-3xl font-black text-slate-800 font-mono">{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{title}</p>
    </div>
  );
}
