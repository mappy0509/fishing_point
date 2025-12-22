// js/reviews.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit, collectionGroup } from "firebase/firestore";

// DOM要素
const reviewsContainer = document.getElementById('reviews-container');

// 初期化処理
document.addEventListener('DOMContentLoaded', initReviewsPage);

async function initReviewsPage() {
  if (!reviewsContainer) return;

  try {
    // 1. 全ポイント情報を取得してMap化 (ID -> {name, area, thumbnail})
    // ※ ポイント数が増えた場合は非効率になるため、将来的にはレビューデータ内にポイント名を含めるか、
    //    必要な分だけ都度取得する方式への変更を検討してください。
    const pointsMap = await fetchPointsMap();

    // 2. 全レビューを取得 (collectionGroupクエリ)
    // Firestoreのインデックス作成が必要になる場合があります。
    // コンソールでエラーが出た場合、ログのリンクからインデックスを作成してください。
    const reviews = await fetchAllReviews();

    // 3. 描画
    renderReviews(reviews, pointsMap);

  } catch (error) {
    console.error("Error initializing reviews page:", error);
    reviewsContainer.innerHTML = `
      <div class="col-span-full text-center py-12 text-red-500 bg-white rounded-xl shadow-sm">
        <p>データの読み込みに失敗しました。</p>
        <p class="text-sm mt-2 text-gray-400">※初回アクセス時はインデックス構築中の可能性があります。</p>
      </div>
    `;
  }
}

/**
 * 全ポイント情報を取得してMapにして返す
 */
async function fetchPointsMap() {
  const map = new Map();
  try {
    const q = collection(db, "fishing-points");
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      map.set(doc.id, {
        name: data.name,
        area: data.area,
        thumbnail: data.images?.thumbnails?.[0] || null
      });
    });
  } catch (err) {
    console.warn("Points fetch error:", err);
  }
  return map;
}

/**
 * 全レビューを新着順に取得
 */
async function fetchAllReviews() {
  // 'reviews' という名前のサブコレクションをすべて対象にする
  const q = query(
    collectionGroup(db, "reviews"),
    orderBy("createdAt", "desc"),
    limit(20) // とりあえず最新20件
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    // 親ドキュメント (fishing-points/{id}) のIDを取得
    const pointId = doc.ref.parent.parent?.id;
    return {
      id: doc.id,
      pointId: pointId,
      ...doc.data()
    };
  });
}

/**
 * レビュー一覧を描画
 */
function renderReviews(reviews, pointsMap) {
  reviewsContainer.innerHTML = '';

  if (reviews.length === 0) {
    reviewsContainer.innerHTML = `
      <div class="col-span-full text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
        <p class="text-gray-500 mb-4">まだ投稿された口コミはありません。</p>
        <a href="area.html" class="btn btn-primary">ポイントを探して投稿する</a>
      </div>
    `;
    return;
  }

  reviews.forEach(review => {
    const point = pointsMap.get(review.pointId) || { name: '不明なポイント', area: 'unknown', thumbnail: null };
    const card = createReviewCard(review, point);
    reviewsContainer.appendChild(card);
  });
}

/**
 * レビューカードのHTML要素を作成
 */
function createReviewCard(review, point) {
  const div = document.createElement('div');
  div.className = 'bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full';

  // 日付
  let dateStr = '';
  if (review.createdAt && review.createdAt.toDate) {
    dateStr = review.createdAt.toDate().toLocaleDateString('ja-JP');
  } else {
    dateStr = '日付不明';
  }

  // 星
  const rating = Number(review.rating) || 3;
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const starColor = rating >= 4 ? 'text-yellow-400' : 'text-gray-300';

  // エリア名
  const areaLabel = getAreaLabel(point.area);

  div.innerHTML = `
    <a href="point-detail.html?id=${review.pointId}" class="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 group">
      <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
        <img src="${point.thumbnail || 'https://via.placeholder.com/100'}" alt="${point.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
      </div>
      <div>
        <p class="text-xs text-brand-600 font-bold">${areaLabel}</p>
        <h3 class="font-bold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">${point.name}</h3>
      </div>
      <div class="ml-auto">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300 group-hover:text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
         </svg>
      </div>
    </a>

    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <img src="${review.userIcon || 'https://via.placeholder.com/40'}" alt="User" class="w-8 h-8 rounded-full bg-gray-100 object-cover">
        <span class="text-sm font-medium text-gray-700">${review.userName || '匿名アングラー'}</span>
      </div>
      <span class="text-xs text-gray-400">${dateStr}</span>
    </div>

    <div class="flex items-center ${starColor} mb-2 text-sm">
      ${stars}
      <span class="ml-2 text-gray-400 text-xs font-medium">(${rating})</span>
    </div>

    <div class="flex-grow">
      <p class="text-gray-600 text-sm leading-relaxed line-clamp-4 whitespace-pre-wrap">${review.comment}</p>
    </div>
  `;

  return div;
}

// ヘルパー: エリア名変換
function getAreaLabel(areaCode) {
  const areaMap = {
    'fukuoka': '福岡エリア', 'saga': '佐賀エリア', 'nagasaki': '長崎エリア',
    'oita': '大分エリア', 'kumamoto': '熊本エリア', 'miyazaki': '宮崎エリア', 'kagoshima': '鹿児島エリア',
    'unknown': 'エリア不明'
  };
  return areaMap[areaCode] || areaCode; 
}