// js/admin-setup.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";

// ★設定：管理者になるための合言葉
const ADMIN_SECRET_KEY = "ISOLINK2025"; 

const setupForm = document.getElementById('setup-form');
const secretKeyInput = document.getElementById('secret-key');
const statusMessage = document.getElementById('status-message');
const submitBtn = document.getElementById('submit-btn');

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  // ログイン状態の確認
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      console.log("Logged in as:", user.email);
      // 既に管理者かチェック
      checkIfAlreadyAdmin(user.uid);
    } else {
      // 未ログインならログインページへ誘導
      alert("管理者権限を設定するには、まずアカウントにログインしてください。");
      window.location.href = "login.html";
    }
  });

  if (setupForm) {
    setupForm.addEventListener('submit', handleSetup);
  }
});

async function checkIfAlreadyAdmin(uid) {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().role === 'admin') {
      showStatus("あなたのアカウントは既に管理者権限を持っています。", "success");
      submitBtn.textContent = "管理画面へ移動";
      submitBtn.onclick = (e) => {
        e.preventDefault();
        window.location.href = "admin.html";
      };
    }
  } catch (error) {
    console.error("Check error:", error);
  }
}

async function handleSetup(e) {
  e.preventDefault();
  if (!currentUser) return;

  const inputKey = secretKeyInput.value.trim();

  // 合言葉の照合
  if (inputKey !== ADMIN_SECRET_KEY) {
    showStatus("シークレットキーが間違っています。", "error");
    return;
  }

  // ローディング表示
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "設定中...";

  try {
    // Firestoreのユーザー情報に role: 'admin' を追加
    const userDocRef = doc(db, "users", currentUser.uid);
    
    await updateDoc(userDocRef, {
      role: 'admin',
      adminSince: new Date()
    });

    showStatus("成功！管理者権限が付与されました。", "success");
    
    setTimeout(() => {
      if(confirm("権限の付与が完了しました。管理画面へ移動しますか？")) {
        window.location.href = "admin.html";
      }
    }, 500);

  } catch (error) {
    console.error("Setup error:", error);
    showStatus("エラーが発生しました。もう一度お試しください。", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.classList.remove('hidden', 'bg-red-50', 'text-red-600', 'bg-green-50', 'text-green-600');
  
  if (type === 'error') {
    statusMessage.classList.add('bg-red-50', 'text-red-600', 'block');
  } else {
    statusMessage.classList.add('bg-green-50', 'text-green-600', 'block');
  }
}