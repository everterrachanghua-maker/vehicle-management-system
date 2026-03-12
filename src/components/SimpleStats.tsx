import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SimpleStats({ vehicles }: { vehicles: any[] }) {
  // 準備圖表數據：計算每台車從初始到現在跑了多少
  const chartData = vehicles.map(v => ({
    name: v.name,
    total: (v.current_odo || 0) - (v.initialOdo || 0),
    current: v.current_odo
  })).sort((a, b) => b.total - a.total); // 按行駛里程排序

  const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">各車輛行駛總里程分析</h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold', fontSize: 12}} width={100} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
              />
              <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={25}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 數據小卡 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chartData.map((v, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center">
            <p className="font-bold text-slate-700">{v.name}</p>
            <div className="text-right">
               <p className="text-xl font-black text-slate-900">{v.total.toLocaleString()} <span className="text-xs text-slate-400">km</span></p>
               <p className="text-[10px] font-bold text-emerald-500 uppercase">總行駛里程</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
