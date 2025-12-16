import { registerUser } from './auth-service.js';

// フォーム要素の取得
const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 通常の送信をキャンセル
    
    // エラーメッセージをリセット
    if (errorMessage) {
      errorMessage.classList.add('hidden');
      errorMessage.textContent = '';
      errorMessage.className = 'text-red-500 text-sm hidden font-medium text-center mb-4'; // クラスを初期状態に戻す
    }

    // 入力値の取得
    const lastName = document.getElementById('last-name').value.trim();
    const firstName = document.getElementById('first-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = signupForm.querySelector('button[type="submit"]');

    // --- バリデーション (入力チェック) ---

    // 1. 空文字チェック (HTMLのrequiredでも防げるが念のため)
    if (!lastName || !firstName) {
      showError('氏名を入力してください。');
      return;
    }

    // 2. パスワード強度チェック
    if (password.length < 8) {
      showError('パスワードは8文字以上で設定してください。');
      return;
    }

    // --- 送信処理開始 ---

    // ボタンをローディング状態にする
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      登録処理中...
    `;
    submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

    try {
      // Firebaseで登録処理を実行
      await registerUser(email, password, lastName, firstName);
      
      // 登録成功時
      alert('登録が完了しました！トップページへ移動します。');
      window.location.href = 'index.html';

    } catch (error) {
      console.error(error);
      
      // エラーメッセージの日本語化
      let msg = "登録中にエラーが発生しました。通信環境を確認してください。";
      if (error.code === 'auth/email-already-in-use') {
        msg = "このメールアドレスは既に登録されています。";
      } else if (error.code === 'auth/invalid-email') {
        msg = "メールアドレスの形式が正しくありません。";
      } else if (error.code === 'auth/weak-password') {
        msg = "パスワードが脆弱すぎます。より複雑なパスワードを設定してください。";
      } else if (error.code === 'auth/network-request-failed') {
        msg = "通信エラーが発生しました。ネットワーク接続を確認してください。";
      }
      
      showError(msg);

      // ボタンを元の状態に戻す
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  });
}

// エラーメッセージ表示用ヘルパー関数
function showError(msg) {
  if (errorMessage) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
    // アニメーション用のクラスを追加（任意）
    errorMessage.classList.add('animate-pulse');
  } else {
    alert(msg);
  }
}