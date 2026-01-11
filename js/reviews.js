// js/reviews.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit, collectionGroup, doc, getDoc } from "firebase/firestore";

// DOM要素
const reviewsContainer = document.getElementById('reviews-container');

// 初期化処理
document.addEventListener('DOMContentLoaded', initReviewsPage);

async function initReviewsPage() {
  if (!reviewsContainer) return;

  try {
    // 1. 全レビューを取得 (collectionGroupクエリ)
    // 最新20件のみ取得
    const reviews = await fetchAllReviews();

    // 2. ポイント情報の解決 (非正規化対応 & 後方互換)
    // レビュー内にポイント情報があればそれを使い、なければ個別取得する
    const enrichedReviews = await resolvePointInfo(reviews);

    // 3. 描画
    renderReviews(enrichedReviews);

  } catch (error) {
    console.error("Error initializing reviews page:", error);
    reviewsContainer.innerHTML = `
      <div class="col-span-full text-center py-12 text-red-500 bg-white rounded-xl shadow-sm">
        <p>データの読み込みに失敗しました。</p>
        <p class="text-sm mt-2 text-gray-400">※ネットワーク接続を確認してください。</p>
      </div>
    `;
  }
}

/**
 * 全レビューを新着順に取得
 */
async function fetchAllReviews() {
  const q = query(
    collectionGroup(db, "reviews"),
    orderBy("createdAt", "desc"),
    limit(20)
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
 * レビューデータにポイント情報を結合する
 * (データ非正規化への過渡期用ロジック)
 */
async function resolvePointInfo(reviews) {
  // 重複するポイントIDへのアクセスを減らすためのキャッシュ
  const pointCache = new Map();

  const promises = reviews.map(async (review) => {
    // A. 既にレビューデータ内にポイント情報が含まれている場合 (新仕様)
    if (review.pointName && review.pointArea) {
      return review;
    }

    // B. ポイント情報がない場合 (旧仕様データ) -> Firestoreから個別取得
    if (!review.pointId) return review;

    // キャッシュにあればそれを使う
    if (pointCache.has(review.pointId)) {
      return { ...review, ...pointCache.get(review.pointId) };
    }

    try {
      // ポイントドキュメントを取得
      const pointRef = doc(db, "fishing-points", review.pointId);
      const pointSnap = await getDoc(pointRef);

      if (pointSnap.exists()) {
        const data = pointSnap.data();
        const pointInfo = {
          pointName: data.name,
          pointArea: data.area,
          pointThumbnail: data.images?.thumbnails?.[0] || null
        };
        // キャッシュに保存
        pointCache.set(review.pointId, pointInfo);
        return { ...review, ...pointInfo };
      }
    } catch (err) {
      console.warn(`Failed to fetch point info for ${review.pointId}`, err);
    }

    // 取得失敗時はUnknown扱い
    return { 
      ...review, 
      pointName: '不明なポイント', 
      pointArea: 'unknown', 
      pointThumbnail: null 
    };
  });

  return Promise.all(promises);
}

/**
 * レビュー一覧を描画
 */
function renderReviews(reviews) {
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
    const card = createReviewCard(review);
    reviewsContainer.appendChild(card);
  });
}

/**
 * レビューカードのHTML要素を作成
 */
function createReviewCard(review) {
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

  // ポイント情報 (非正規化されたフィールドを使用)
  const pointName = review.pointName || '不明なポイント';
  const pointThumbnail = review.pointThumbnail || 'https://via.placeholder.com/100';
  const areaLabel = getAreaLabel(review.pointArea || 'unknown');

  div.innerHTML = `
    <a href="point-detail.html?id=${review.pointId}" class="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 group">
      <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
        <img src="${pointThumbnail}" alt="${pointName}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onerror="this.src='https://via.placeholder.com/100'">
      </div>
      <div>
        <p class="text-xs text-brand-600 font-bold">${areaLabel}</p>
        <h3 class="font-bold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">${pointName}</h3>
      </div>
      <div class="ml-auto">
         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-300 group-hover:text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
         </svg>
      </div>
    </a>

    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <img src="${review.userIcon || 'https://via.placeholder.com/40'}" alt="User" class="w-8 h-8 rounded-full bg-gray-100 object-cover" onerror="this.src='https://via.placeholder.com/40'">
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