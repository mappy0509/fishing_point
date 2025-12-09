// js/area.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// エリア名の表示用マッピング
const areaNameMap = {
  'fukuoka-munakata': '福岡・宗像',
  'fukuoka-itoshima': '福岡・糸島',
  'saga-yobuko': '佐賀・呼子',
  'nagasaki-hirado': '長崎・平戸',
  'nagasaki-goto': '長崎・五島列島',
  'nagasaki-sasebo': '長崎・佐世保',
  'nagasaki-danjo': '長崎・男女群島',
  'oita-tsurumi': '大分・鶴見',
  'oita-kamae': '大分・蒲江',
  'miyazaki-kitaura': '宮崎・北浦',
  'kagoshima-sata': '鹿児島・佐多岬',
  'kagoshima-koshikijima': '鹿児島・甑島'
};

/**
 * 全てのポイントを取得する関数
 */
export async function fetchAllPoints() {
  try {
    const q = query(collection(db, "fishing-points"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const points = [];
    querySnapshot.forEach((doc) => {
      points.push({ id: doc.id, ...doc.data() });
    });
    return points;
  } catch (error) {
    console.error("Error getting documents: ", error);
    return [];
  }
}

/**
 * ポイントカードのHTMLを生成する
 */
function createPointCard(point) {
  const thumbnail = point.images && point.images.thumbnails && point.images.thumbnails.length > 0 
    ? point.images.thumbnails[0] 
    : 'https://placehold.co/600x400?text=No+Image';
  
  const hasVR = point.images && point.images.vr;

  return `
    <a href="point-detail.html?id=${point.id}" class="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 block">
      <div class="h-48 overflow-hidden relative">
        <img src="${thumbnail}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">
        ${hasVR ? `<div class="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">360°ビューあり</div>` : ''}
      </div>
      <div class="p-6">
        <h3 class="font-bold text-lg mb-2 group-hover:text-brand-600 transition-colors">${point.name}</h3>
        <p class="text-gray-600 text-sm mb-4 truncate">${point.captain?.comment || '詳細な情報は詳細ページで確認してください。'}</p>
        <div class="flex flex-wrap gap-2">
          <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${areaNameMap[point.area] || 'その他エリア'}</span>
        </div>
      </div>
    </a>
  `;
}

/**
 * ページにポイント一覧を描画する
 */
export async function initAreaPage() {
  const container = document.getElementById('area-list-container');
  if (!container) return; // コンテナがない場合は何もしない

  // ローディング表示
  container.innerHTML = '<div class="text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div><p class="mt-4 text-gray-500">ポイント情報を読み込み中...</p></div>';

  const points = await fetchAllPoints();

  if (points.length === 0) {
    container.innerHTML = '<div class="text-center py-12 text-gray-500">登録されたポイントはまだありません。</div>';
    return;
  }

  // エリアごとにグループ化
  const groupedPoints = points.reduce((acc, point) => {
    const area = point.area || 'others';
    if (!acc[area]) acc[area] = [];
    acc[area].push(point);
    return acc;
  }, {});

  // HTML生成
  let html = '';
  
  // 存在するエリアのみセクションを作成して表示
  for (const [areaKey, areaPoints] of Object.entries(groupedPoints)) {
    const areaTitle = areaNameMap[areaKey] || 'その他エリア';
    
    html += `
      <section class="mb-16">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center border-l-4 border-brand-500 pl-4">
          ${areaTitle}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${areaPoints.map(point => createPointCard(point)).join('')}
        </div>
      </section>
    `;
  }

  container.innerHTML = html;
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', initAreaPage);