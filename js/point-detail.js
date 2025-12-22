// js/point-detail.js
import { db, auth } from './firebase-config.js';
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { 
  toggleFavorite, 
  checkFavoriteStatus, 
  addReview, 
  getReviews 
} from './db-service.js';

let currentPointId = null;
let isFavorite = false;
let currentUser = null;

// DOM要素
const reviewFormContainer = document.getElementById('review-form-container');
const reviewLoginMessage = document.getElementById('review-login-message');
const reviewForm = document.getElementById('review-form');
const reviewsList = document.getElementById('reviews-list');
const reviewCountBadge = document.getElementById('review-count-badge');

/**
 * URLパラメータからIDを取得する
 */
function getPointIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * ポイント詳細を表示する (メイン処理)
 */
async function renderPointDetail() {
  currentPointId = getPointIdFromUrl();

  if (!currentPointId) {
    alert('ポイントIDが指定されていません。');
    window.location.href = 'area.html';
    return;
  }

  try {
    const docRef = doc(db, "fishing-points", currentPointId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      updatePageContent(data);
      
      initFavoriteButton();
      initReviewSection();
    } else {
      alert('指定されたポイントが見つかりませんでした。');
      window.location.href = 'area.html';
    }
  } catch (error) {
    console.error("Error getting document:", error);
    alert('データの読み込みに失敗しました。');
  }
}

/**
 * ページの基本情報を更新
 */
function updatePageContent(data) {
  document.title = `${data.name} - 磯リンク`;
  setText('point-title', data.name);
  setText('point-area-label', getAreaLabel(data.area));
  
  // 360度画像背景
  const heroSection = document.getElementById('hero-section-bg');
  if (heroSection && data.images?.vr) {
    const img = heroSection.querySelector('img');
    if(img) img.src = data.images.vr;
  }

  // 船長情報 (リンク付きに変更)
  if (data.captain) {
    const captainName = data.captain.name;
    const encodedName = encodeURIComponent(captainName);
    
    // 名前をリンク化
    const captainNameEl = document.getElementById('captain-name');
    if (captainNameEl) {
      captainNameEl.innerHTML = `<a href="captain.html?name=${encodedName}" class="hover:text-brand-600 hover:underline transition-colors" title="${captainName}船長のページへ">${captainName}</a>`;
    }

    setText('captain-comment', `「${data.captain.comment}」`);
    
    // 画像もリンク化 (クリック可能に)
    if (data.captain.photoUrl) {
      const captainImgContainer = document.querySelector('#captain-image')?.parentElement;
      const captainImg = document.getElementById('captain-image');
      
      if (captainImg) {
        captainImg.src = data.captain.photoUrl;
        
        // 画像コンテナがdivなら、aタグでラップするかクリックイベントを追加
        if (captainImgContainer) {
          captainImgContainer.style.cursor = 'pointer';
          captainImgContainer.onclick = () => {
            window.location.href = `captain.html?name=${encodedName}`;
          };
          captainImgContainer.title = `${captainName}船長の詳細を見る`;
        }
      }
    }
  }

  // Googleマップリンク
  if (data.location) {
    const mapLink = document.getElementById('google-map-link');
    if (mapLink) {
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${data.location.lat},${data.location.lng}`;
    }
  }
}

// --- お気に入り機能 ---

function initFavoriteButton() {
  const titleEl = document.getElementById('point-title');
  if (!titleEl) return;

  // 既にボタンがある場合は削除（二重追加防止）
  const existingBtn = document.getElementById('favorite-btn');
  if (existingBtn && existingBtn.parentNode) {
    existingBtn.parentNode.remove();
  }

  const btnContainer = document.createElement('span');
  btnContainer.className = 'ml-4 inline-flex items-center align-middle';
  
  const favBtn = document.createElement('button');
  favBtn.id = 'favorite-btn';
  favBtn.className = 'text-gray-400 hover:text-red-500 transition-colors focus:outline-none disabled:opacity-50';
  updateFavoriteButtonState(favBtn, false);
  
  btnContainer.appendChild(favBtn);
  titleEl.parentNode.insertBefore(btnContainer, titleEl.nextSibling);

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    
    if (user) {
      favBtn.disabled = false;
      isFavorite = await checkFavoriteStatus(user.uid, currentPointId);
      updateFavoriteButtonState(favBtn, isFavorite);

      favBtn.onclick = async () => {
        favBtn.disabled = true;
        try {
          const newState = await toggleFavorite(user.uid, currentPointId);
          isFavorite = newState;
          updateFavoriteButtonState(favBtn, isFavorite);
        } catch (err) {
          console.error('Favorite toggle error:', err);
        } finally {
          favBtn.disabled = false;
        }
      };
      
      if (reviewFormContainer) reviewFormContainer.classList.remove('hidden');
      if (reviewLoginMessage) reviewLoginMessage.classList.add('hidden');

    } else {
      favBtn.disabled = false;
      updateFavoriteButtonState(favBtn, false);
      favBtn.onclick = () => {
        if(confirm('お気に入り機能を使うにはログインが必要です。ログインページへ移動しますか？')) {
          window.location.href = `login.html`;
        }
      };

      if (reviewFormContainer) reviewFormContainer.classList.add('hidden');
      if (reviewLoginMessage) reviewLoginMessage.classList.remove('hidden');
    }
  });
}

function updateFavoriteButtonState(btn, active) {
  if (active) {
    btn.classList.remove('text-gray-400');
    btn.classList.add('text-red-500');
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 animate-bounce-once" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>`;
    btn.title = 'お気に入りから削除';
  } else {
    btn.classList.remove('text-red-500');
    btn.classList.add('text-gray-400');
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>`;
    btn.title = 'お気に入りに追加';
  }
}

// --- 口コミ機能 ---

async function initReviewSection() {
  await loadAndRenderReviews();

  if (reviewForm) {
    // イベントリスナーの重複登録を防ぐため、一度クローンして置換するテクニックを使用
    const newForm = reviewForm.cloneNode(true);
    reviewForm.parentNode.replaceChild(newForm, reviewForm);
    newForm.addEventListener('submit', handleReviewSubmit);
  }
}

async function loadAndRenderReviews() {
  if (!reviewsList) return;

  try {
    reviewsList.innerHTML = '<div class="text-center py-4"><svg class="animate-spin h-6 w-6 text-brand-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>';
    
    const reviews = await getReviews(currentPointId);
    
    if (reviewCountBadge) {
      reviewCountBadge.textContent = `${reviews.length}件`;
    }

    reviewsList.innerHTML = '';
    
    if (reviews.length === 0) {
      reviewsList.innerHTML = `<div class="text-center py-8 text-gray-400"><p>まだ投稿はありません。<br>最初の投稿者になりましょう！</p></div>`;
      return;
    }

    reviews.forEach(review => {
      reviewsList.appendChild(createReviewElement(review));
    });

  } catch (error) {
    console.error("Reviews load error:", error);
    reviewsList.innerHTML = '<p class="text-red-500 text-center">読み込みに失敗しました。</p>';
  }
}

function createReviewElement(review) {
  const div = document.createElement('div');
  div.className = 'border-b border-gray-100 pb-6 last:border-0 last:pb-0';
  
  let dateStr = '';
  if (review.createdAt && review.createdAt.toDate) {
    dateStr = review.createdAt.toDate().toLocaleDateString('ja-JP');
  }

  const stars = '★'.repeat(Number(review.rating)) + '☆'.repeat(5 - Number(review.rating));
  const starColor = Number(review.rating) >= 4 ? 'text-yellow-400' : 'text-gray-300';

  div.innerHTML = `
    <div class="flex items-start gap-4">
      <img src="${review.userIcon || 'https://via.placeholder.com/40'}" alt="User" class="w-10 h-10 rounded-full object-cover bg-gray-200">
      <div class="flex-grow">
        <div class="flex items-center justify-between mb-1">
          <span class="font-bold text-gray-800 text-sm">${review.userName || '匿名ユーザー'}</span>
          <span class="text-xs text-gray-400">${dateStr}</span>
        </div>
        <div class="flex items-center mb-2 ${starColor} text-sm">
          ${stars}
        </div>
        <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">${review.comment}</p>
      </div>
    </div>
  `;
  return div;
}

async function handleReviewSubmit(e) {
  e.preventDefault();
  if (!currentUser) {
    alert('セッションが切れました。再ログインしてください。');
    return;
  }

  const form = e.target; // イベント発生元のフォームを使用
  const ratingEl = form.querySelector('#review-rating');
  const commentEl = form.querySelector('#review-comment');
  const submitBtn = form.querySelector('button[type="submit"]');

  const rating = ratingEl.value;
  const comment = commentEl.value.trim();

  if (!comment) {
    alert('コメントを入力してください。');
    return;
  }

  const originalBtnText = submitBtn.innerText;
  submitBtn.disabled = true;
  submitBtn.innerText = '送信中...';

  try {
    const reviewData = {
      userId: currentUser.uid,
      userName: currentUser.displayName || '匿名アングラー',
      userIcon: currentUser.photoURL || null,
      rating: parseInt(rating, 10),
      comment: comment
    };

    await addReview(currentPointId, reviewData);
    
    form.reset();
    await loadAndRenderReviews();
    
    alert('投稿しました！ありがとうございました。');

  } catch (error) {
    console.error("Review submit error:", error);
    alert('投稿中にエラーが発生しました。');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function getAreaLabel(areaCode) {
  const areaMap = {
    'fukuoka': '福岡エリア', 'saga': '佐賀エリア', 'nagasaki': '長崎エリア',
    'oita': '大分エリア', 'kumamoto': '熊本エリア', 'miyazaki': '宮崎エリア', 'kagoshima': '鹿児島エリア'
  };
  return areaMap[areaCode] || areaCode; 
}

document.addEventListener('DOMContentLoaded', renderPointDetail);