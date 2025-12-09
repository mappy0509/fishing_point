// js/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// あなたのFirebase設定情報
const firebaseConfig = {
  apiKey: "AIzaSyDajMu6vO1P52udgoE6FnK6OMLAMb3mWKo",
  authDomain: "isolink-af50c.firebaseapp.com",
  projectId: "isolink-af50c",
  storageBucket: "isolink-af50c.firebasestorage.app",
  messagingSenderId: "660958318220",
  appId: "1:660958318220:web:1eaa77e6ae3a5158f4b5a9"
};

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// 各サービスのインスタンスをエクスポート
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);