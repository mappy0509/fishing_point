// js/area.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

// エリア名の表示用マッピング
const areaNameMap = {
  'fukuoka': '福岡エリア',
  'saga': '佐賀エリア',
  'nagasaki': '長崎エリア',
  'oita': '大分エリア',
  'kumamoto': '熊本エリア',
  'miyazaki': '宮崎エリア',
  'kagoshima': '鹿児島エリア'
};

// 詳細エリアのマッピング（サブエリア）
const subAreaMap = {
  'fukuoka-munakata': '宗像・沖ノ島',
  'fukuoka-itoshima': '糸島',
  'saga-yobuko': '呼子・加唐島',
  'nagasaki-hirado': '平戸・宮ノ浦',
  'nagasaki-goto': '五島列島',
  'nagasaki-sasebo': '佐世保・九十九島',
  'nagasaki-danjo': '男女群島',
  'oita-tsurumi': '鶴見・米水津',
  'oita-kamae': '蒲江・深島',
  'miyazaki-kitaura': '北浦・島野浦',
  'kagoshima-sata': '佐多岬',
  'kagoshima-koshikijima': '甑島列島'
};

let allPointsCache = []; // 全データをキャッシュしてフィルタリングに使用

document.addEventListener('DOMContentLoaded', async () => {
  await initAreaPage();
  setupFilterEvents();
});

async function initAreaPage() {
  const container = document.getElementById('area-list'); // HTMLのIDに合わせて修正 (area.htmlは area-list というIDを使用)
  if (!container) return;

  // ローディング表示
  container.innerHTML = `
    <div class="col-span-full text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
      <p class="mt-4 text-gray-500">ポイント情報を読み込み中...</p>
    </div>
  `;

  // 全件取得してキャッシュ
  allPointsCache = await fetchAllPoints();

  // URLパラメータの確認 (?area=fukuoka など)
  const urlParams = new URLSearchParams(window.location.search);
  const targetArea = urlParams.get('area');

  // ボタンのアクティブ状態を更新
  if (targetArea) {
    updateFilterButtons(targetArea);
    renderPoints(targetArea);
  } else {
    renderPoints('all');
  }
}

async function fetchAllPoints() {
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

function setupFilterEvents() {
  const buttons = document.querySelectorAll('.area-filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.getAttribute('data-filter');
      
      // URLの状態も更新（リロードなし）
      const newUrl = filter === 'all' 
        ? window.location.pathname 
        : `${window.location.pathname}?area=${filter}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

      updateFilterButtons(filter);
      renderPoints(filter);
    });
  });
}

function updateFilterButtons(activeFilter) {
  document.querySelectorAll('.area-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-filter') === activeFilter) {
      btn.classList.add('active', 'bg-brand-50', 'text-brand-600', 'ring-2', 'ring-brand-100');
      btn.classList.remove('bg-gray-100', 'text-gray-600');
    } else {
      btn.classList.remove('active', 'bg-brand-50', 'text-brand-600', 'ring-2', 'ring-brand-100');
      btn.classList.add('bg-gray-100', 'text-gray-600');
    }
  });
}

function renderPoints(filter) {
  const container = document.getElementById('area-list');
  if (!container) return;

  // フィルタリング実行
  // areaフィールドが "fukuoka-munakata" のような形式なので、前方一致でフィルタリングする
  const filteredPoints = filter === 'all' 
    ? allPointsCache 
    : allPointsCache.filter(p => p.area && p.area.startsWith(filter));

  if (filteredPoints.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
        <p class="text-gray-500 font-bold mb-2">該当するポイントが見つかりません</p>
        <p class="text-xs text-gray-400">条件を変更するか、後ほど再度お試しください。</p>
      </div>
    `;
    return;
  }

  // HTML生成
  // area.htmlの構造に合わせて、カードリストを表示する
  // 既存のarea.htmlは「エリアごとの概要カード」を表示する構造だったが、
  // 詳細検索として「個別のポイントカード」を表示する形に変更してユーザビリティを向上させる
  container.innerHTML = filteredPoints.map(point => createPointCard(point)).join('');
}

function createPointCard(point) {
  const thumbnail = point.images && point.images.thumbnails && point.images.thumbnails.length > 0 
    ? point.images.thumbnails[0] 
    : '/img/hero-bg.jpg';
  
  const hasVR = point.images && point.images.vr; // 簡易判定
  const subAreaName = subAreaMap[point.area] || point.area || 'エリア情報なし';

  return `
    <a href="point-detail.html?id=${point.id}" class="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 block flex flex-col h-full">
      <div class="h-48 overflow-hidden relative">
        <img src="${thumbnail}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" onerror="this.src='/img/hero-bg.jpg'">
        ${hasVR ? `<div class="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>360°ビュー</div>` : ''}
        <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
           <span class="text-xs text-white bg-brand-600 px-2 py-0.5 rounded-full">${subAreaName}</span>
        </div>
      </div>
      <div class="p-4 flex-grow flex flex-col">
        <h3 class="font-bold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors line-clamp-1">${point.name}</h3>
        <p class="text-gray-500 text-xs mb-3 line-clamp-2 flex-grow">${point.description || point.captain?.comment || '詳細な情報は詳細ページで確認してください。'}</p>
        <div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
           <div class="flex items-center gap-1">
             <span class="text-xs font-bold text-brand-600">★ ${point.rating || '---'}</span>
           </div>
           <span class="text-xs text-gray-400">詳細を見る &rarr;</span>
        </div>
      </div>
    </a>
  `;
}