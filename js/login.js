import { loginUser } from './auth-service.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const errorMsg = document.getElementById('error-message'); // エラー表示用エリアがあれば

      // ボタンをローディング状態に
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'ログイン中...';
      if(errorMsg) errorMsg.classList.add('hidden');

      try {
        await loginUser(email, password);
        // ログイン成功時のリダイレクト
        window.location.href = 'mypage.html'; 
      } catch (error) {
        console.error("Login failed:", error);
        
        let message = "ログインに失敗しました。";
        // エラーコードに応じたメッセージの出し分け
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          message = "メールアドレスまたはパスワードが間違っています。";
        } else if (error.code === 'auth/configuration-not-found') {
          message = "認証設定が無効です。管理者に問い合わせてください。";
        } else if (error.code === 'auth/too-many-requests') {
          message = "試行回数が多すぎます。しばらく待ってから再試行してください。";
        }

        if(errorMsg) {
            errorMsg.textContent = message;
            errorMsg.classList.remove('hidden');
        } else {
            alert(message);
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }
});