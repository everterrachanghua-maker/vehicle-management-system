import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. 匯入 Storage 功能

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 初始化 Firebase 實例
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// 2. 初始化 Firestore 資料庫
const db = getFirestore(app);

// 3. 初始化 Storage 雲端儲存
const storage = getStorage(app);

// 4. 同時導出 db 與 storage 以供其他組件使用
export { db, storage };
