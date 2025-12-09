// js/map.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// エリア名のマッピング（area.jsと共通化推奨ですが、今回は個別に定義）
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
 * データを取得してマップとリストを初期化する
 */
async function initMap() {
  const sidebarContainer = document.getElementById('map-sidebar-list');
  const pinsContainer = document.getElementById('map-pins-container');

  if (!sidebarContainer || !pinsContainer) return;

  try {
    // データを取得
    const q = query(collection(db, "fishing-points"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const points = [];
    querySnapshot.forEach((doc) => {
      points.push({ id: doc.id, ...doc.data() });
    });

    // コンテンツをクリア
    sidebarContainer.innerHTML = '';
    pinsContainer.innerHTML = '';

    if (points.length === 0) {
      sidebarContainer.innerHTML = '<div class="text-center py-8 text-gray-500">ポイントが見つかりません</div>';
      return;
    }

    // ポイントごとにリストアイテムとピンを生成
    points.forEach(point => {
      // 1. サイドバーのリストアイテム生成
      const listItem = document.createElement('a');
      listItem.href = `point-detail.html?id=${point.id}`;
      listItem.className = "block bg-white p-3 rounded-lg border border-gray-200 hover:border-brand-500 hover:shadow-md transition group mb-3";
      listItem.innerHTML = `
        <div class="flex gap-3">
          <img src="${point.images?.thumbnails?.[0] || 'https://placehold.co/100x100?text=No+Img'}" class="w-20 h-20 rounded object-cover flex-shrink-0">
          <div>
            <div class="flex justify-between items-start">
              <h3 class="font-bold text-gray-900 text-sm group-hover:text-brand-600">${point.name}</h3>
              ${point.images?.vr ? `<span class="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded ml-1">360°</span>` : ''}
            </div>
            <p class="text-xs text-gray-500 mt-1 mb-2">${areaNameMap[point.area] || '九州エリア'}</p>
            <div class="flex items-center gap-2">
              ${point.captain?.photoUrl ? `<img src="${point.captain.photoUrl}" class="w-5 h-5 rounded-full border border-gray-200">` : ''}
              <span class="text-xs text-gray-600">${point.captain?.name || '船長情報なし'}</span>
            </div>
          </div>
        </div>
      `;

      // 2. 地図上のピン生成
      const pin = document.createElement('div');
      // Admin.jsのMockロジックの逆計算で位置を決定
      // baseLat=33.0, baseLng=129.0
      const top = (point.location.lat - 33.0) * 100; 
      const left = (point.location.lng - 129.0) * 100;
      
      pin.className = "absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform duration-300 hover:scale-125 z-10 text-brand-600 drop-shadow-lg";
      pin.style.top = `${Math.min(Math.max(top, 0), 100)}%`; // 画面外にはみ出さないように制限
      pin.style.left = `${Math.min(Math.max(left, 0), 100)}%`;
      pin.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        <div class="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-white rounded shadow-xl p-2 text-center text-xs font-bold text-gray-800 z-50">
          ${point.name}
        </div>
      `;

      // 3. インタラクション（ホバー連動）
      // リストにホバーしたらピンを強調
      listItem.addEventListener('mouseenter', () => {
        pin.classList.add('scale-150', 'text-red-600', 'z-50');
      });
      listItem.addEventListener('mouseleave', () => {
        pin.classList.remove('scale-150', 'text-red-600', 'z-50');
      });

      // ピンをクリックしたら詳細ページへ
      pin.addEventListener('click', () => {
        window.location.href = `point-detail.html?id=${point.id}`;
      });

      sidebarContainer.appendChild(listItem);
      pinsContainer.appendChild(pin);
    });

  } catch (error) {
    console.error("Error fetching points:", error);
    sidebarContainer.innerHTML = '<div class="text-center py-8 text-red-500">読み込みエラーが発生しました</div>';
  }
}

document.addEventListener('DOMContentLoaded', initMap);