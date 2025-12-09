import { registerUser } from './auth-service.js';

// フォーム要素の取得
// 注意: 次のステップでHTML側に id="signup-form" を追加します
const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // 通常の送信をキャンセル
    
    if (errorMessage) {
      errorMessage.classList.add('hidden');
      errorMessage.textContent = '';
    }

    const lastName = document.getElementById('last-name').value;
    const firsttName = document.getElementById('first-name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      // Firebaseで登録処理を実行
      await registerUser(email, password, lastName, firsttName);
      
      // 登録成功時の遷移先
      alert('登録が完了しました！');
      window.location.href = 'index.html';
    } catch (error) {
      console.error(error);
      if (errorMessage) {
        errorMessage.classList.remove('hidden');
        
        // エラーメッセージの日本語化
        let msg = "登録中にエラーが発生しました。";
        if (error.code === 'auth/email-already-in-use') {
          msg = "このメールアドレスは既に使用されています。";
        } else if (error.code === 'auth/weak-password') {
          msg = "パスワードは6文字以上で設定してください。";
        }
        errorMessage.textContent = msg;
      }
    }
  });
}