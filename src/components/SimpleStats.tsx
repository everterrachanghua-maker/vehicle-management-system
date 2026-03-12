import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Fuel, Droplets, Gauge, Hash } from 'lucide-react';

// 定義資料型別
interface Vehicle {
  id: string;
  name: string;
  plate: string;
  current_odo: number;
}

interface LogRecord {
  vehicleId: string;
  type?: string;      // 舊版邏輯
  hasFuel?: boolean;  // 新版邏輯
  hasWash?: boolean;
  mileageDiff?: number;
}

export default function SimpleStats({ vehicles }: { vehicles: Vehicle[] }) {
  const [records, setRecords] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const snap = await getDocs(collection(db, "records"));
        const data = snap.docs.map(d => d.data() as LogRecord);
        setRecords(data);
      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">各車數據績效報告</h2>
          <p className="text-xs text-slate-500 mt-1">基於歷史填報紀錄之匯總統計</p>
        </div>
        <div className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">
          LIVE DATA
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {vehicles.map(v => {
          // 篩選屬於該車的紀錄
          const vLogs = records.filter(r => r.vehicleId === v.id);
          
          // 加油次數：相容新舊兩種邏輯 (有 type='fuel' 或是 hasFuel=true)
          const fuelCount = vLogs.filter(r => r.type === 'fuel' || r.hasFuel === true).length;
          
          // 洗車次數
          const washCount = vLogs.filter(r => r.hasWash === true).length;
          
          // 累計行駛里程 (從每筆填報的差值加總)
          const totalDistance = vLogs.reduce((acc, curr) => acc + (curr.mileageDiff || 0), 0);

          return (
            <div key={v.id} className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              {/* 車輛基本資訊 */}
              <div className="border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{v.plate}</p>
                <p className="text-xl font-bold text-slate-800">{v.name}</p>
              </div>
              
              {/* 數據 1: 總里程 (舊版最看重的數據) */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl">
                  <Gauge size={20}/>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-700">
                    {(v.current_odo || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">目前總里程 (Odo)</p>
                </div>
              </div>

              {/* 數據 2: 加油統計 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-orange-50 text-orange-500 rounded-2xl">
                  <Fuel size={20}/>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-700">{fuelCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">累計加油次數</p>
                </div>
              </div>

              {/* 數據 3: 洗車/維護 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-500 rounded-2xl">
                  <Droplets size={20}/>
                </div>
                <div>
                  <p className="text-lg font-black text-slate-700">{washCount}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">洗車美容頻率</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {vehicles.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-400 text-sm">
          暫無車輛統計數據
        </div>
      )}
    </div>
  );
}
