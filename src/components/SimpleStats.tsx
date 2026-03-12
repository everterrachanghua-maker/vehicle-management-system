import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart 
} from 'recharts';
import { Activity, Car, Milestone, TrendingUp } from 'lucide-react';

export default function SimpleStats({ vehicles }: { vehicles: any[] }) {
  // 計算總覽數據
  const totalFleetDriven = vehicles.reduce((acc, v) => acc + ((v.current_odo || 0) - (v.initialOdo || 0)), 0);
  
  const chartData = vehicles.map(v => ({
    name: v.name,
    driven: (v.current_odo || 0) - (v.initialOdo || 0),
    plate: v.plate
  })).sort((a, b) => b.driven - a.driven);

  // 專業配色方案
  const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#0ea5e9', '#10b981'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. 頂部專業數據摘要卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Milestone size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">全車隊總行駛</p>
            <p className="text-2xl font-black text-slate-800">{totalFleetDriven.toLocaleString()} <span className="text-sm font-normal text-slate-400">km</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Car size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">在線車輛總數</p>
            <p className="text-2xl font-black text-slate-800">{vehicles.length} <span className="text-sm font-normal text-slate-400">輛</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">最高使用率車輛</p>
            <p className="text-xl font-bold text-slate-800 truncate w-32">{chartData[0]?.name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* 2. 主圖表區塊 */}
      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden">
        {/* 裝飾用的背景文字 */}
        <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none">
          <Activity size={200} />
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">各車輛行駛績效分析</h2>
          <p className="text-slate-400 text-sm font-medium mt-1">累積行駛里程統計 (排除初始值)</p>
        </div>
        
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 13, fontWeight: 700}} 
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 11}} 
                tickFormatter={(val) => `${val}km`}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc', radius: 10}}
                content={<CustomTooltip />}
              />
              <Bar 
                dataKey="driven" 
                radius={[12, 12, 0, 0]} 
                barSize={45}
                animationDuration={1500}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// 3. 客製化專業浮窗 (Tooltip)
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0f172a] p-4 rounded-2xl shadow-2xl border border-slate-700 text-white">
        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{data.plate}</p>
        <p className="text-sm font-bold mb-2">{data.name}</p>
        <div className="h-px bg-slate-700 w-full mb-2" />
        <p className="text-lg font-black font-mono">
          {payload[0].value.toLocaleString()} <span className="text-xs font-normal text-slate-400">km</span>
        </p>
        <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase">累計行駛里程</p>
      </div>
    );
  }
  return null;
}
