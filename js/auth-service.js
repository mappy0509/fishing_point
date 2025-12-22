// js/auth-service.js
import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendPasswordResetEmail // 追加
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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
 * パスワード再設定メール送信 (追加)
 */
export async function resetUserPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
}