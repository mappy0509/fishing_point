// js/admin.js
import { monitorAuthState, getUserRole } from './auth-service.js';
import { addFishingPoint } from './db-service.js';

// 認証＆権限チェック
// ログイン状態かつ、Firestoreのroleが 'admin' の場合のみアクセスを許可
monitorAuthState(async (user) => {
  if (!user) {
    // 未ログイン
    alert('管理者権限が必要です。ログインしてください。');
    window.location.href = 'login.html';
    return;
  }

  // ログイン済みの場合、権限を確認
  const role = await getUserRole(user.uid);
  if (role !== 'admin') {
    // ログインしているが管理者ではない
    alert('管理者権限がありません。トップページへ移動します。');
    window.location.href = 'index.html';
  }
});

// Mock Map Logic (地図をクリックして座標を取得する機能)
const mockMap = document.getElementById('mock-map');
const pin = document.getElementById('map-pin');
const latInput = document.getElementById('point-lat');
const lngInput = document.getElementById('point-lng');

if (mockMap) {
  mockMap.addEventListener('click', (e) => {
    const rect = mockMap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // ピンを表示・移動
    pin.style.left = x + 'px';
    pin.style.top = y + 'px';
    pin.classList.remove('hidden');

    // 座標の計算 (デモ用の簡易計算)
    const baseLat = 33.0;
    const baseLng = 129.0;
    const randomLat = baseLat + (y / rect.height);
    const randomLng = baseLng + (x / rect.width);

    latInput.value = randomLat.toFixed(6);
    lngInput.value = randomLng.toFixed(6);
  });
}

// フォーム送信処理
const addPointForm = document.getElementById('admin-add-point-form');

if (addPointForm) {
  addPointForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 送信ボタンを無効化（二重送信防止）
    const submitBtn = addPointForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '保存中...';

    try {
      // フォームデータの取得
      const pointData = {
        name: document.getElementById('point-name').value,
        area: document.getElementById('point-area').value,
        lat: document.getElementById('point-lat').value,
        lng: document.getElementById('point-lng').value,
        captainName: document.getElementById('captain-name').value,
        captainComment: document.getElementById('captain-comment').value,
      };

      // ファイルの取得
      const vrFile = document.getElementById('point-360-file').files[0];
      const photoFiles = document.getElementById('point-photos').files;
      const captainPhotoFile = document.getElementById('captain-photo').files[0];

      // データベースへの保存実行
      await addFishingPoint(pointData, vrFile, photoFiles, captainPhotoFile);

      alert('ポイント情報を登録しました！');
      addPointForm.reset();
      pin.classList.add('hidden'); // ピンを隠す

    } catch (error) {
      console.error(error);
      alert('登録に失敗しました。権限設定や通信状況を確認してください。');
    } finally {
      // ボタンを元に戻す
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}