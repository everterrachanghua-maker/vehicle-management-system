// 修改元件參數接收 isAdmin
export default function Garage({ vehicles, isAdmin }: { vehicles: any[], isAdmin: boolean }) {
  // ... 其他程式碼 ...
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-500 text-sm">我的車庫</h2>
        {/* 只有 Admin 能看見新增按鈕 */}
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full">+ 新增車輛</button>
        )}
      </div>
      {/* ... 顯示列表 ... */}
    </div>
  );
}
