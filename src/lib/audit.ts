import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function logAction(userId: string, userName: string, action: string, module: string, details: any, reason: string = "") {
  await addDoc(collection(db, "audit_logs"), {
    userId,
    userName,
    action, // 'CREATE', 'UPDATE', 'DELETE', 'OVERRIDE'
    module, // 'ITINERARY', 'VEHICLE', 'ODOMETER', 'USER'
    details, // { before: ..., after: ... }
    reason,
    timestamp: serverTimestamp()
  });
}
