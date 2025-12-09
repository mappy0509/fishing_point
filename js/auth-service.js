// js/auth-service.js
import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

/**
 * 新規ユーザー登録処理
 * Authenticationへの登録に加え、Firestoreのusersコレクションにデータを保存します。
 * デフォルトの権限(role)は 'member' (一般ユーザー) とします。
 */
export async function registerUser(email, password, lastName, firstName) {
  try {
    // 1. Authenticationでユーザー作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 2. 表示名の設定
    await updateProfile(user, {
      displayName: `${lastName} ${firstName}`
    });

    // 3. Firestoreにユーザー情報を保存（ここで役割を管理）
    await setDoc(doc(db, "users", user.uid), {
      firstName: firstName,
      lastName: lastName,
      email: email,
      role: 'member', // デフォルトは一般会員。管理者はFirebaseコンソールで 'admin' に変更する運用。
      createdAt: serverTimestamp(),
    });
    
    return user;
  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
}

/**
 * ログイン処理
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
}

/**
 * ログアウト処理
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
}

/**
 * 認証状態の監視
 */
export function monitorAuthState(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

/**
 * ユーザーの役割（role）を取得する関数
 * 管理画面へのアクセス制限などに使用します。
 */
export async function getUserRole(uid) {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().role; // 'admin' or 'member'
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}