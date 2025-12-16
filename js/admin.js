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

// --- Google Map Logic ---
let map;
let marker;

// グローバル関数として定義 (Google Maps APIのcallbackから呼ばれるため)
window.initAdminMap = () => {
  const mapElement = document.getElementById('admin-map');
  if (!mapElement) return;

  // 初期表示位置 (九州中心付近)
  const defaultLocation = { lat: 33.0, lng: 130.5 };
  
  map = new google.maps.Map(mapElement, {
    center: defaultLocation,
    zoom: 7,
    streetViewControl: false,
    mapTypeControl: false
  });

  // クリックイベントでマーカーを設置
  map.addListener("click", (e) => {
    placeMarkerAndPanTo(e.latLng);
  });
};

function placeMarkerAndPanTo(latLng) {
  if (marker) {
    marker.setPosition(latLng);
  } else {
    marker = new google.maps.Marker({
      position: latLng,
      map: map,
      animation: google.maps.Animation.DROP
    });
  }
  
  // マップ中心を移動するかは任意（連続登録しやすいよう今回は移動しない、必要なら map.panTo(latLng)）
  // map.panTo(latLng);

  // フォームに値をセット
  const latInput = document.getElementById('point-lat');
  const lngInput = document.getElementById('point-lng');
  
  if (latInput && lngInput) {
    latInput.value = latLng.lat().toFixed(6);
    lngInput.value = latLng.lng().toFixed(6);
  }
  
  // エラー表示があれば消す
  hideError();
}

// --- フォーム送信処理 ---
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
    
    // 1. 座標チェック
    if (!latValue || !lngValue) {
      showError('位置情報が設定されていません。地図上をクリックしてピンを設置してください。');
      const mapEl = document.getElementById('admin-map');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        mapEl.classList.add('ring-4', 'ring-red-500');
        setTimeout(() => mapEl.classList.remove('ring-4', 'ring-red-500'), 2000);
      }
      return;
    }

    // 2. 必須ファイルチェック (360度画像)
    if (!vrFileInput.files || vrFileInput.files.length === 0) {
      showError('360度パノラマ画像は必須です。ファイルを選択してください。');
      vrFileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // --- 送信処理 ---

    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
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

      // DBサービスを呼び出し
      await addFishingPoint(pointData, vrFile, photoFiles, captainPhotoFile);

      alert('ポイント情報を正常に登録しました！');
      
      // フォームリセット
      addPointForm.reset();
      if (marker) marker.setMap(null); // ピンを削除
      marker = null;
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