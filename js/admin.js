// js/admin.js
import { monitorAuthState, getUserRole, addNewAdmin } from './auth-service.js';
import { addFishingPoint, getAllFishingPoints, deleteFishingPoint, updateFishingPoint, getFishingPoint } from './db-service.js';

// --- Loading Overlay Helper ---
function showLoadingOverlay(message = "処理中...") {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-80 z-50 flex flex-col items-center justify-center text-white';
    overlay.innerHTML = `
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-500 mb-4"></div>
      <p id="loading-message" class="text-lg font-bold animate-pulse">${message}</p>
      <p class="text-sm text-gray-400 mt-2">画面を閉じずにそのままお待ちください</p>
    `;
    document.body.appendChild(overlay);
  } else {
    document.getElementById('loading-message').textContent = message;
    overlay.classList.remove('hidden');
  }
}

function updateLoadingMessage(message) {
  const msgEl = document.getElementById('loading-message');
  if (msgEl) msgEl.textContent = message;
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.add('hidden');
}


// 認証＆権限チェック & リスト読み込み
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
    } else {
      // 管理者ならリスト読み込み
      loadPointList();
    }
  } catch (error) {
    console.error("権限チェックエラー:", error);
    alert('権限情報の取得に失敗しました。');
  }
});


// --- Google Map Logic ---
let map;
let marker;

window.initAdminMap = () => {
  const mapElement = document.getElementById('admin-map');
  if (!mapElement) return;

  const defaultLocation = { lat: 33.0, lng: 130.5 };
  
  map = new google.maps.Map(mapElement, {
    center: defaultLocation,
    zoom: 7,
    streetViewControl: false,
    mapTypeControl: false
  });

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
  
  const latInput = document.getElementById('point-lat');
  const lngInput = document.getElementById('point-lng');
  
  if (latInput && lngInput) {
    latInput.value = latLng.lat().toFixed(6);
    lngInput.value = latLng.lng().toFixed(6);
  }
  
  hideError();
}


// --- ポイント一覧・編集・削除ロジック ---

// 一覧読み込み
window.loadPointList = async function() {
  const tbody = document.getElementById('points-list-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">読み込み中...</td></tr>';

  const points = await getAllFishingPoints();

  if (points.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">登録されたポイントはありません</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  points.forEach(point => {
    const dateStr = point.createdAt ? point.createdAt.toDate().toLocaleDateString('ja-JP') : '-';
    const tr = document.createElement('tr');
    tr.className = 'border-b hover:bg-gray-50 transition';
    tr.innerHTML = `
      <td class="px-6 py-4 font-medium text-gray-900">${point.name}</td>
      <td class="px-6 py-4 text-gray-500">${point.area}</td>
      <td class="px-6 py-4 text-gray-400 text-xs">${dateStr}</td>
      <td class="px-6 py-4 text-center space-x-2">
        <button onclick="startEditPoint('${point.id}')" class="text-blue-600 hover:text-blue-900 font-bold text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50">編集</button>
        <button onclick="confirmDeletePoint('${point.id}', '${point.name}')" class="text-red-600 hover:text-red-900 font-bold text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
};

// 削除確認
window.confirmDeletePoint = async function(id, name) {
  if (!confirm(`本当に「${name}」を削除しますか？\nこの操作は取り消せません。`)) return;

  showLoadingOverlay("削除しています...");
  try {
    await deleteFishingPoint(id);
    hideLoadingOverlay();
    alert("削除しました。");
    loadPointList(); // リスト更新
  } catch (error) {
    console.error(error);
    hideLoadingOverlay();
    alert("削除に失敗しました。");
  }
};

// 編集開始
window.startEditPoint = async function(id) {
  showLoadingOverlay("データを取得中...");
  try {
    const point = await getFishingPoint(id);
    if (!point) throw new Error("データが見つかりません");

    // フォームに値をセット
    document.getElementById('edit-point-id').value = point.id;
    document.getElementById('point-name').value = point.name;
    document.getElementById('point-area').value = point.area;
    document.getElementById('point-lat').value = point.location.lat;
    document.getElementById('point-lng').value = point.location.lng;
    
    // マップのピンを移動
    const latLng = new google.maps.LatLng(point.location.lat, point.location.lng);
    if (map) {
        placeMarkerAndPanTo(latLng);
        map.panTo(latLng);
    }

    document.getElementById('captain-name').value = point.captain?.name || '';
    document.getElementById('captain-comment').value = point.captain?.comment || '';

    // UIを編集モードに変更
    toggleEditMode(true);
    
    // スクロール
    document.getElementById('admin-add-point-form').scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error(error);
    alert("編集データの取得に失敗しました");
  } finally {
    hideLoadingOverlay();
  }
};

// 編集モード切り替え
function toggleEditMode(isEdit) {
  const formTitle = document.getElementById('form-title');
  const submitText = document.getElementById('submit-btn-text');
  const submitBtn = document.getElementById('submit-point-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  const vrBadge = document.getElementById('vr-required-badge');
  const vrInput = document.getElementById('point-360-file');

  if (isEdit) {
    formTitle.textContent = "ポイント情報の編集";
    formTitle.classList.add("text-blue-400");
    submitText.textContent = "変更を保存する";
    submitBtn.classList.replace('bg-brand-600', 'bg-blue-600');
    submitBtn.classList.replace('hover:bg-brand-700', 'hover:bg-blue-700');
    cancelBtn.classList.remove('hidden');
    
    // 編集時は画像必須ではない
    vrBadge.classList.add('hidden');
    vrInput.removeAttribute('required');
  } else {
    // リセット (新規モード)
    document.getElementById('admin-add-point-form').reset();
    document.getElementById('edit-point-id').value = '';
    
    formTitle.textContent = "新規ポイント登録";
    formTitle.classList.remove("text-blue-400");
    submitText.textContent = "この内容で登録する";
    submitBtn.classList.replace('bg-blue-600', 'bg-brand-600');
    submitBtn.classList.replace('hover:bg-blue-700', 'hover:bg-brand-700');
    cancelBtn.classList.add('hidden');
    
    // 新規時は画像必須
    vrBadge.classList.remove('hidden');
    vrInput.setAttribute('required', 'required');

    // ピン削除
    if (marker) marker.setMap(null);
    marker = null;
  }
}

// キャンセルボタン
const cancelBtn = document.getElementById('cancel-edit-btn');
if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    toggleEditMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


// --- フォーム送信処理 ---
const addPointForm = document.getElementById('admin-add-point-form');
const errorContainer = document.getElementById('admin-error-message');
const errorDetail = errorContainer ? errorContainer.querySelector('.error-detail') : null;

if (addPointForm) {
  addPointForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const editId = document.getElementById('edit-point-id').value;
    const isEdit = !!editId;

    const nameInput = document.getElementById('point-name');
    const areaInput = document.getElementById('point-area');
    const latValue = document.getElementById('point-lat').value;
    const lngValue = document.getElementById('point-lng').value;
    const vrFileInput = document.getElementById('point-360-file');

    // バリデーション
    if (!latValue || !lngValue) {
      showError('位置情報が設定されていません。');
      return;
    }
    
    // 新規登録時のみVR画像必須チェック
    if (!isEdit && (!vrFileInput.files || vrFileInput.files.length === 0)) {
      showError('360度パノラマ画像は必須です。');
      return;
    }

    showLoadingOverlay(isEdit ? "変更を保存しています..." : "処理を開始します...");

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

      if (isEdit) {
        // 更新処理
        await updateFishingPoint(
          editId,
          pointData,
          vrFile,
          photoFiles,
          captainPhotoFile,
          (msg) => updateLoadingMessage(msg)
        );
        alert('ポイント情報を更新しました！');
        toggleEditMode(false);
      } else {
        // 新規登録処理
        await addFishingPoint(
          pointData, 
          vrFile, 
          photoFiles, 
          captainPhotoFile,
          (msg) => updateLoadingMessage(msg)
        );
        alert('ポイント情報を正常に登録しました！');
        addPointForm.reset();
        if (marker) marker.setMap(null);
        marker = null;
      }

      hideLoadingOverlay();
      loadPointList(); // リスト更新
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error(error);
      hideLoadingOverlay();
      showError('処理に失敗しました。\n' + error.message);
    }
  });
}

// --- 管理者追加フォーム送信処理 ---
const addUserForm = document.getElementById('admin-add-user-form');

if (addUserForm) {
  addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('new-admin-email').value.trim();
    const lastName = document.getElementById('new-admin-lastname').value.trim();
    const firstName = document.getElementById('new-admin-firstname').value.trim();
    const password = document.getElementById('new-admin-password').value;
    const submitBtn = addUserForm.querySelector('button[type="submit"]');

    if (!email) {
      alert("メールアドレスは必須です。");
      return;
    }

    if (!confirm(`${email} を管理者に設定しますか？`)) {
      return;
    }

    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `処理中...`;

    try {
      const result = await addNewAdmin(email, password, lastName, firstName);

      if (result.status === 'promoted') {
        alert(`既存ユーザー (${result.name}) に管理者権限を付与しました！`);
      } else if (result.status === 'created') {
        alert(`新規管理者アカウント (${email}) を作成しました！`);
      } else if (result.status === 'already_admin') {
        alert(`このユーザー (${email}) は既に管理者です。`);
      }

      addUserForm.reset();

    } catch (error) {
      console.error("Admin add error:", error);
      let msg = "エラーが発生しました。";
      if (error.code === 'auth/email-already-in-use') {
        msg = "このメールアドレスは既にAuthで使用されていますが、Firestoreにデータが見つかりませんでした。";
      } else if (error.message.includes("パスワード")) {
        msg = error.message;
      }
      alert(msg);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
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