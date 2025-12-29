// js/mypage.js
import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged, signOut, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getUserFavorites, getFishingPoint } from './db-service.js';

// DOM要素 (HTMLのIDに合わせて修正)
const profileNameEl = document.getElementById('mypage-user-name');
const profileEmailEl = document.getElementById('mypage-user-email');
const profileIconEl = document.getElementById('mypage-user-icon');
const logoutBtn = document.getElementById('mypage-logout-btn');
const resetPasswordBtn = document.getElementById('change-password-btn'); // HTMLのID 'change-password-btn' に合わせる
const favoritesContainer = document.getElementById('favorites-list'); // HTMLのID 'favorites-list' に合わせる

// モーダル関連
const editModal = document.getElementById('edit-modal');
const editProfileBtn = document.getElementById('edit-icon-btn'); // HTMLのID 'edit-icon-btn' に統一（ボタンが1つのみのため）
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveProfileBtn = document.getElementById('save-profile-btn');
const modalOverlay = document.getElementById('modal-overlay');

// フォーム要素
const editLastNameInput = document.getElementById('edit-last-name');
const editFirstNameInput = document.getElementById('edit-first-name');
const iconUploadInput = document.getElementById('icon-upload'); // HTMLのlabel for="icon-upload" と input id="icon-upload"
const modalPreviewIcon = document.getElementById('modal-preview-icon');

let currentUserData = null;
let selectedImageFile = null;
// デフォルト画像をローカルに変更
const DEFAULT_ICON_URL = "/img/default-user.jpg";

document.addEventListener('DOMContentLoaded', () => {
  initMypage();
  setupModalEvents();
});

function initMypage() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await fetchAndDisplayUserData(user);
      loadUserFavorites(user.uid);
    } else {
      // ログインしていない場合はログインページへ
      window.location.href = 'login.html';
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // パスワード変更イベント
  if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault(); // リンク遷移を防止
        handlePasswordReset();
    });
  }
}

async function fetchAndDisplayUserData(user) {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      currentUserData = userSnap.data();
      const fullName = `${currentUserData.lastName || ''} ${currentUserData.firstName || ''}`.trim();
      if (profileNameEl) profileNameEl.textContent = fullName || user.displayName || '名無しのアングラー';
      if (profileEmailEl) profileEmailEl.textContent = user.email;

      const iconUrl = currentUserData.profileImageUrl || user.photoURL || DEFAULT_ICON_URL;
      if (profileIconEl) {
        profileIconEl.src = iconUrl;
        // エラー時のフォールバック
        profileIconEl.onerror = () => { profileIconEl.src = DEFAULT_ICON_URL; };
      }
      
      if (currentUserData.role === 'admin') {
        renderAdminButton();
      }
    } else {
      if (profileNameEl) profileNameEl.textContent = user.displayName || 'ユーザー情報なし';
      if (profileEmailEl) profileEmailEl.textContent = user.email;
      if (profileIconEl) profileIconEl.src = DEFAULT_ICON_URL;
      currentUserData = { lastName: '', firstName: '' };
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    if(profileNameEl) profileNameEl.textContent = "読み込みエラー";
  }
}

function renderAdminButton() {
  // 管理者ボタンを追加する場所を探す（mypage.htmlに合わせて調整が必要）
  // 現在のmypage.htmlには 'admin-btn-area' がないため、
  // 'change-password-btn' の親要素（メニューリスト）の先頭に追加する処理に変更
  const menuContainer = document.querySelector('.max-w-2xl > .bg-white'); // メニューのコンテナ
  if (!menuContainer || document.getElementById('admin-link-btn')) return;

  const adminLink = document.createElement('a');
  adminLink.id = 'admin-link-btn';
  adminLink.href = 'admin.html';
  adminLink.className = 'flex items-center justify-between p-4 hover:bg-gray-50 transition border-b border-gray-100';
  adminLink.innerHTML = `
    <div class="flex items-center gap-3">
        <div class="bg-gray-800 p-2 rounded-lg text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </div>
        <span class="text-sm font-medium text-gray-700">管理者ダッシュボード</span>
    </div>
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  `;
  
  // 先頭に挿入
  menuContainer.insertBefore(adminLink, menuContainer.firstChild);
}

// パスワード変更処理
async function handlePasswordReset() {
  const user = auth.currentUser;
  if (!user || !user.email) return;

  if (confirm(`ご登録のメールアドレス (${user.email}) 宛に\nパスワード再設定用のメールを送信しますか？`)) {
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert('再設定メールを送信しました。\nメールを確認して新しいパスワードを設定してください。');
    } catch (error) {
      console.error("Password reset error:", error);
      alert('メールの送信に失敗しました。時間をおいて再度お試しください。');
    }
  }
}

// モーダル制御
function setupModalEvents() {
  const openModalHandler = () => {
    if (!currentUserData) return;
    if (editLastNameInput) editLastNameInput.value = currentUserData.lastName || '';
    if (editFirstNameInput) editFirstNameInput.value = currentUserData.firstName || '';
    if (modalPreviewIcon && profileIconEl) modalPreviewIcon.src = profileIconEl.src;
    selectedImageFile = null;
    if (editModal) editModal.classList.remove('hidden');
  };

  // 編集ボタン（アイコン上のペンマーク）
  if (editProfileBtn) editProfileBtn.addEventListener('click', openModalHandler);

  const closeModalHandler = () => {
    if (editModal) editModal.classList.add('hidden');
  };

  if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeModalHandler);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModalHandler);

  if (iconUploadInput) {
    iconUploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => { 
          if(modalPreviewIcon) modalPreviewIcon.src = e.target.result; 
      };
      reader.readAsDataURL(file);
      try {
        selectedImageFile = await compressImage(file, 300, 0.8);
      } catch (err) {
        console.error("Image compression failed:", err);
        selectedImageFile = file;
      }
    });
  }

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', handleSaveProfile);
  }
}

async function handleSaveProfile() {
  const user = auth.currentUser;
  if (!user) return;
  const newLastName = editLastNameInput.value.trim();
  const newFirstName = editFirstNameInput.value.trim();

  if (!newLastName || !newFirstName) {
    alert("氏名は必須です。");
    return;
  }

  const originalBtnText = saveProfileBtn.innerHTML;
  saveProfileBtn.disabled = true;
  saveProfileBtn.innerHTML = `保存中...`;

  try {
    let profileImageUrl = currentUserData?.profileImageUrl || user.photoURL;
    if (selectedImageFile) {
      const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, selectedImageFile);
      profileImageUrl = await getDownloadURL(storageRef);
    }

    const userDocRef = doc(db, "users", user.uid);
    const updateData = {
      lastName: newLastName,
      firstName: newFirstName,
      profileImageUrl: profileImageUrl,
      updatedAt: new Date()
    };
    await updateDoc(userDocRef, updateData);
    await updateProfile(user, { displayName: `${newLastName} ${newFirstName}`, photoURL: profileImageUrl });

    currentUserData = { ...currentUserData, ...updateData };
    if (profileNameEl) profileNameEl.textContent = `${newLastName} ${newFirstName}`;
    if (profileIconEl) profileIconEl.src = profileImageUrl || DEFAULT_ICON_URL;
    alert("プロフィールを更新しました！");
    if (editModal) editModal.classList.add('hidden');
  } catch (error) {
    console.error("Profile update error:", error);
    if (error.code === 'storage/unauthorized') {
      alert("画像の保存権限がありません。Storageルールを確認してください。");
    } else {
      alert("保存中にエラーが発生しました。");
    }
  } finally {
    saveProfileBtn.disabled = false;
    saveProfileBtn.innerHTML = originalBtnText;
  }
}

function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          blob ? resolve(blob) : reject(new Error('Canvas conversion failed'));
        }, 'image/jpeg', quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// 共通パーツ
async function loadUserFavorites(userId) {
  if (!favoritesContainer) return;

  // 表示エリアの初期化
  favoritesContainer.innerHTML = `
    <div class="col-span-full text-center py-12">
      <svg class="animate-spin h-8 w-8 text-brand-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-gray-500">お気に入りを読み込み中...</p>
    </div>
  `;

  try {
    const favoriteIds = await getUserFavorites(userId);

    // お気に入り数のカウント更新
    const favCountEl = document.getElementById('fav-count');
    if (favCountEl) favCountEl.textContent = favoriteIds.length;

    if (favoriteIds.length === 0) {
      renderEmptyFavorites();
      return;
    }

    const pointPromises = favoriteIds.map(id => getFishingPoint(id));
    const points = await Promise.all(pointPromises);
    const validPoints = points.filter(p => p !== null);

    if (validPoints.length === 0) {
      renderEmptyFavorites();
      return;
    }

    favoritesContainer.innerHTML = ''; 
    validPoints.forEach(point => {
      const card = createFavoriteCard(point);
      favoritesContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Error loading favorites:", error);
    favoritesContainer.innerHTML = `
      <div class="col-span-full text-center py-12 text-red-500">
        読み込み中にエラーが発生しました。
      </div>
    `;
  }
}

function renderEmptyFavorites() {
  favoritesContainer.innerHTML = `
    <div class="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
      <p class="text-gray-500 mb-2">まだお気に入りのポイントがありません。</p>
      <a href="area.html" class="text-brand-600 hover:text-brand-700 font-medium underline">エリアから探す</a>
    </div>
  `;
}

function createFavoriteCard(point) {
  const div = document.createElement('div');
  div.className = 'bg-white rounded-xl shadow-card overflow-hidden hover:shadow-lg transition-shadow duration-300';
  
  // 外部依存(via.placeholder)を削除し、画像がない場合のUIを調整
  let thumbUrl = '/img/logo.png'; // 適切なデフォルト画像がない場合はロゴなどを指定
  let hasImage = false;

  if (point.images && point.images.thumbnails && point.images.thumbnails[0]) {
    thumbUrl = point.images.thumbnails[0];
    hasImage = true;
  }

  const areaLabelMap = {
    'fukuoka': '福岡エリア', 'saga': '佐賀エリア', 'nagasaki': '長崎エリア',
    'oita': '大分エリア', 'kumamoto': '熊本エリア', 'miyazaki': '宮崎エリア', 'kagoshima': '鹿児島エリア'
  };
  const areaName = areaLabelMap[point.area] || point.area || '九州エリア';

  div.innerHTML = `
    <div class="relative h-48 bg-gray-200">
      <img src="${thumbUrl}" alt="${point.name}" class="w-full h-full object-cover ${hasImage ? '' : 'opacity-50 p-8'}" onerror="this.src='/img/default-user.jpg'">
      <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-700 shadow">
        ${areaName}
      </div>
    </div>
    <div class="p-5">
      <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-1">${point.name}</h3>
      <p class="text-gray-600 text-sm mb-4 line-clamp-2">${point.description || '詳細情報なし'}</p>
      <div class="flex items-center justify-between mt-auto">
        <a href="point-detail.html?id=${point.id}" class="text-brand-600 hover:text-brand-800 font-medium text-sm flex items-center">
          詳細を見る
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  `;
  return div;
}

async function handleLogout() {
  try {
    if (confirm('ログアウトしますか？')) {
      await signOut(auth);
      window.location.href = 'index.html';
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert('ログアウト中にエラーが発生しました。');
  }
}