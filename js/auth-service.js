// js/auth-service.js
import { auth, db, firebaseConfig } from './firebase-config.js';
import { initializeApp, deleteApp } from "firebase/app"; // Secondary App用
import { 
  getAuth as getAuthSec, 
  createUserWithEmailAndPassword as createUserSec, 
  signOut as signOutSec,
  updateProfile as updateProfileSec
} from "firebase/auth"; // Secondary Auth用
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";

/**
 * ユーザー登録処理 (Auth + Firestore)
 */
export async function registerUser(email, password, lastName, firstName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: `${lastName} ${firstName}`
    });

    await setDoc(doc(db, "users", user.uid), {
      email: email,
      lastName: lastName,
      firstName: firstName,
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return user;
  } catch (error) {
    console.error("Registration error in auth-service:", error);
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
    console.error("Login error:", error);
    throw error;
  }
}

/**
 * ログアウト処理
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

/**
 * パスワード再設定メール送信
 */
export async function resetUserPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
}

/**
 * 認証状態の監視
 */
export function monitorAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * ユーザーロール（権限）の取得
 */
export async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    throw error;
  }
}

/**
 * 管理者を追加する（既存ユーザー昇格 or 新規作成）
 * ※現在のログインセッションを維持したまま新規作成するためにSecondary Appを使用
 */
export async function addNewAdmin(email, tempPassword, lastName, firstName) {
  try {
    // 1. まず既存ユーザーかどうかをFirestoreで検索
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // --- パターンA: 既存ユーザーあり -> 権限昇格 ---
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // 既に管理者の場合はエラーにするか通知する
      if (userData.role === 'admin') {
        return { status: 'already_admin', email: email };
      }

      // roleをadminに更新
      await updateDoc(doc(db, "users", userDoc.id), {
        role: 'admin',
        updatedAt: serverTimestamp()
      });

      return { 
        status: 'promoted', 
        email: email,
        name: `${userData.lastName} ${userData.firstName}` 
      };

    } else {
      // --- パターンB: 既存ユーザーなし -> 新規作成して管理者権限付与 ---
      
      if (!tempPassword) {
        throw new Error("新規アカウント作成にはパスワードが必要です。");
      }

      // Secondary Appの初期化 (現在のログイン状態を崩さずに別ユーザーを作るため)
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuthSec(secondaryApp);

      try {
        // 新規ユーザー作成
        const userCredential = await createUserSec(secondaryAuth, email, tempPassword);
        const newUser = userCredential.user;

        // プロフィール更新 (表示名)
        await updateProfileSec(newUser, {
          displayName: `${lastName} ${firstName}`
        });

        // Firestoreへの保存 (Main DBインスタンスを使用)
        await setDoc(doc(db, "users", newUser.uid), {
          email: email,
          lastName: lastName,
          firstName: firstName,
          role: 'admin', // 最初からadminとして作成
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Secondary Authからログアウト
        await signOutSec(secondaryAuth);

        return { status: 'created', email: email };

      } catch (createError) {
        throw createError;
      } finally {
        // アプリインスタンスのクリーンアップ
        await deleteApp(secondaryApp);
      }
    }
  } catch (error) {
    console.error("Error adding new admin:", error);
    throw error;
  }
}