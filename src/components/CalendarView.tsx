import { useState, useEffect } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval 
} from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, MapPin, User, Clock, MoreHorizontal } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from 'motion/react';

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // 1. 從 Firebase 即時監聽行程資料
  useEffect(() => {
    const q = query(collection(db, "itineraries"), orderBy("startTime", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItineraries(data);
    });
    return () => unsubscribe();
  }, []);

  // 2. 月曆邏輯計算
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // 3. 取得特定日期的行程
  const getEventsForDay = (day: Date) => {
    return itineraries.filter(event => {
      const eventDate = new Date(event.date); // 假設資料庫存 yyyy-mm-dd
      return isSameDay(day, eventDate);
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* 月曆標題控制列 */}
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">
            {format(currentMonth, 'yyyy年 MMMM', { locale: zhTW })}
          </h2>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 text-sm font-bold hover:bg-white hover:shadow-sm rounded-lg transition-all">
              今天
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> 進行中
          </span>
          <span className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div> 已排程
          </span>
        </div>
      </div>

      {/* 月曆主體 */}
      <div className="flex-1 bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col">
        {/* 星期標頭 */}
        <div className="grid grid-cols-7 bg-slate-50 border-b">
          {['週日', '週一', '週二', '週三', '週四', '週五', '週六'].map((day, i) => (
            <div key={day} className={`py-3 text-center text-xs font-bold uppercase tracking-widest ${i === 0 || i === 6 ? 'text-rose-500' : 'text-slate-400'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* 日期格子 */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {calendarDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div 
                key={idx} 
                className={`border-r border-b p-2 min-h-[120px] transition-colors hover:bg-slate-50/50 ${
                  !isSameMonth(day, monthStart) ? 'bg-slate-50/30 text-slate-300' : 'text-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-mono font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                    isSameDay(day, new Date()) ? 'bg-indigo-600 text-white shadow-md' : ''
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>

                {/* 行程條 */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold truncate transition-all shadow-sm border-l-4 ${
                        event.status === 'ongoing' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-500 hover:bg-emerald-100' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-500 hover:bg-indigo-100'
                      }`}
                    >
                      {event.vehicleName} - {event.taskName}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-slate-400 font-bold pl-2 flex items-center gap-1">
                      <MoreHorizontal size={10} /> 還有 {dayEvents.length - 3} 項...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 詳細資訊抽屜 (Side Drawer) */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-50 p-8 flex flex-col"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    行程詳情
                  </span>
                  <h3 className="text-2xl font-bold mt-4 text-slate-800">{selectedEvent.taskName}</h3>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
              </div>

              <div className="space-y-6 flex-1">
                <DetailItem icon={<Clock size={20}/>} label="預約時段" value={`${selectedEvent.date} ${selectedEvent.startTime} - ${selectedEvent.endTime}`} />
                <DetailItem icon={<Car size={20}/>} label="派遣車輛" value={`${selectedEvent.vehicleName} (${selectedEvent.vehiclePlate})`} />
                <DetailItem icon={<User size={20}/>} label="駕駛/採樣人員" value={selectedEvent.staffNames?.join(', ') || '未指定'} />
                <DetailItem icon={<MapPin size={20}/>} label="目的地/專案" value={selectedEvent.destination} />
                
                <div className="pt-6 border-t">
                    <p className="text-sm font-bold text-slate-400 uppercase mb-2">備註事項</p>
                    <p className="text-slate-600 leading-relaxed italic">"{selectedEvent.notes || '無備註'}"</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button className="p-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">編輯行程</button>
                <button className="p-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">變更狀態</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ icon, label, value }: any) {
  return (
    <div className="flex gap-4">
      <div className="text-slate-300">{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
        <p className="font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}
