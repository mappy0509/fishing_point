// js/signup.js
import { registerUser } from './auth-service.js';

const signupForm = document.getElementById('signup-form');

document.addEventListener('DOMContentLoaded', () => {
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
});

async function handleSignup(e) {
  e.preventDefault();

  // HTMLのIDと一致するように修正 (email-address -> email)
  const lastNameEl = document.getElementById('last-name');
  const firstNameEl = document.getElementById('first-name');
  const emailEl = document.getElementById('email'); 
  const passwordEl = document.getElementById('password');
  const submitBtn = signupForm.querySelector('button[type="submit"]');

  // 要素が存在しない場合のガード処理
  if (!lastNameEl || !firstNameEl || !emailEl || !passwordEl) {
    console.error("Form elements not found. Check HTML IDs.");
    alert("フォームの読み込みに失敗しました。ページを再読み込みしてください。");
    return;
  }

  const lastName = lastNameEl.value.trim();
  const firstName = firstNameEl.value.trim();
  const email = emailEl.value.trim();
  const password = passwordEl.value;

  // UIローディング表示
  const originalBtnText = submitBtn.innerText;
  submitBtn.disabled = true;
  submitBtn.innerText = '登録処理中...';

  try {
    // auth-serviceの登録関数を呼び出し
    await registerUser(email, password, lastName, firstName);
    
    // 成功したらマイページへ
    alert('会員登録が完了しました！');
    window.location.href = 'mypage.html';

  } catch (error) {
    console.error("Signup error:", error);
    
    let msg = '登録に失敗しました。';
    if (error.code === 'auth/email-already-in-use') {
      msg = 'このメールアドレスは既に登録されています。';
    } else if (error.code === 'auth/weak-password') {
      msg = 'パスワードが弱すぎます。6文字以上の複雑なパスワードにしてください。';
    } else if (error.code === 'auth/invalid-email') {
      msg = 'メールアドレスの形式が正しくありません。';
    } else {
      msg = `エラーが発生しました: ${error.message}`;
    }
    
    alert(msg);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
  }
}