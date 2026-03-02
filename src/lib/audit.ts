import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * 核心稽核記錄函數
 * @param user 目前登入的使用者資訊
 * @param action 操作動作 (CREATE, UPDATE, DELETE, OVERRIDE)
 * @param module 模組名稱 (VEHICLE, ITINERARY, ODOMETER, USER)
 * @param details 變更細節 (前後對比)
 * @param reason 操作原因 (重要操作必填)
 */
export async function logAudit(user: any, action: string, module: string, details: any, reason: string = "") {
  try {
    await addDoc(collection(db, "audit_logs"), {
      operatorId: user.id || 'system',
      operatorName: user.name || '系統自動',
      action, 
      module,
      details,
      reason,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("稽核日誌寫入失敗:", err);
  }
}
