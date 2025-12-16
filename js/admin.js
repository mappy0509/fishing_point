// js/admin.js
import { monitorAuthState, getUserRole } from './auth-service.js';
import { addFishingPoint } from './db-service.js';

// 認証＆権限チェック
monitorAuthState(async (user) => {
  if (!user) {
    alert('管理者権限が必要です。ログインしてください。');
    window.location.href = 'login.html';
    return;
  }

  try {
    const role = await getUserRole(user.uid);
    if (role !== 'admin') {
      alert('管理者権限がありません。トップページへ移動します。');
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error("権限チェックエラー:", error);
    alert('権限情報の取得に失敗しました。');
  }
});

// Mock Map Logic
const mockMap = document.getElementById('mock-map');
const pin = document.getElementById('map-pin');
const latInput = document.getElementById('point-lat');
const lngInput = document.getElementById('point-lng');

if (mockMap) {
  mockMap.addEventListener('click', (e) => {
    const rect = mockMap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pin.style.left = x + 'px';
    pin.style.top = y + 'px';
    pin.classList.remove('hidden');

    const baseLat = 33.0;
    const baseLng = 129.0;
    const randomLat = baseLat + (y / rect.height);
    const randomLng = baseLng + (x / rect.width);

    latInput.value = randomLat.toFixed(6);
    lngInput.value = randomLng.toFixed(6);
    
    hideError();
  });
}

// フォーム送信処理
const addPointForm = document.getElementById('admin-add-point-form');
const errorContainer = document.getElementById('admin-error-message');
const errorDetail = errorContainer ? errorContainer.querySelector('.error-detail') : null;

if (addPointForm) {
  addPointForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    // 入力要素の取得
    const nameInput = document.getElementById('point-name');
    const areaInput = document.getElementById('point-area');
    const latValue = document.getElementById('point-lat').value;
    const lngValue = document.getElementById('point-lng').value;
    const vrFileInput = document.getElementById('point-360-file');
    const submitBtn = addPointForm.querySelector('button[type="submit"]');

    // --- バリデーションチェック ---
    
    if (!latValue || !lngValue) {
      showError('位置情報が設定されていません。地図上をクリックしてピンを設置してください。');
      mockMap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      mockMap.classList.add('ring-2', 'ring-red-500');
      setTimeout(() => mockMap.classList.remove('ring-2', 'ring-red-500'), 2000);
      return;
    }

    if (!vrFileInput.files || vrFileInput.files.length === 0) {
      showError('360度パノラマ画像は必須です。ファイルを選択してください。');
      vrFileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // --- 送信処理 ---

    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    // メッセージを「圧縮・保存中」に変更
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      画像を圧縮・保存中...
    `;
    submitBtn.classList.add('cursor-not-allowed', 'opacity-80');

    try {
      const pointData = {
        name: nameInput.value,
        area: areaInput.value,
        lat: latValue,
        lng: lngValue,
        captainName: document.getElementById('captain-name').value,
        captainComment: document.getElementById('captain-comment').value,
      };

      const vrFile = vrFileInput.files[0];
      const photoFiles = document.getElementById('point-photos').files;
      const captainPhotoFile = document.getElementById('captain-photo').files[0];

      await addFishingPoint(pointData, vrFile, photoFiles, captainPhotoFile);

      alert('ポイント情報を正常に登録しました！');
      
      addPointForm.reset();
      pin.classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error(error);
      showError('登録に失敗しました。管理者権限や通信状況を確認してください。\n' + error.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
      submitBtn.classList.remove('cursor-not-allowed', 'opacity-80');
    }
  });
}

function showError(message) {
  if (errorContainer && errorDetail) {
    errorDetail.textContent = message;
    errorContainer.classList.remove('hidden');
  } else {
    alert(message);
  }
}

function hideError() {
  if (errorContainer) {
    errorContainer.classList.add('hidden');
  }
}