// js/captain.js
import { getPointsByCaptainName } from './db-service.js';
import { db } from './firebase-config.js';
import { collection, getDocs } from "firebase/firestore";

// DOM要素
const mainContainer = document.querySelector('main > .container'); // 既存のコンテンツエリア

// URLパラメータから船長名を取得
function getCaptainNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('name');
}

// 初期化
async function initCaptainPage() {
  const captainName = getCaptainNameFromUrl();

  if (captainName) {
    // A. 特定の船長が指定されている場合 -> 詳細表示
    await renderCaptainDetail(captainName);
  } else {
    // B. 指定がない場合 -> 船長一覧を表示
    await renderCaptainList();
  }
}

// --- A. 詳細表示モード (既存ロジック) ---
async function renderCaptainDetail(captainName) {
  try {
    const points = await getPointsByCaptainName(captainName);

    if (points.length === 0) {
      alert('指定された船長のデータが見つかりませんでした。');
      window.location.href = 'captain.html'; // リストへ戻る
      return;
    }

    const representativePoint = points[0];
    const captainData = representativePoint.captain;
    const boatNameEl = document.getElementById('boat-name');
    const captainNameEl = document.getElementById('captain-name');
    const captainMessageEl = document.getElementById('captain-message');
    const captainPhotoEl = document.getElementById('captain-photo');
    const pointsList = document.getElementById('captain-points-list');

    // データ反映
    document.title = `${captainData.name}船長 - 磯リンク`;
    if (captainNameEl) captainNameEl.textContent = `${captainData.name} 船長`;
    if (boatNameEl) boatNameEl.textContent = `${captainData.name} 渡船`; // 仮
    if (captainMessageEl) {
      captainMessageEl.textContent = captainData.comment || '「安全第一でご案内します。」';
    }
    if (captainPhotoEl && captainData.photoUrl) {
      captainPhotoEl.src = captainData.photoUrl;
    }

    // 担当ポイント一覧
    if (pointsList) {
      pointsList.innerHTML = '';
      points.forEach(point => {
        pointsList.appendChild(createPointCard(point));
      });
    }

  } catch (error) {
    console.error("Error loading captain detail:", error);
  }
}

// --- B. 一覧表示モード (新規追加) ---
async function renderCaptainList() {
  // タイトル変更
  document.title = "船長一覧 - 磯リンク";
  const headerTitle = document.querySelector('h1');
  if (headerTitle) headerTitle.textContent = "提携船長一覧";

  // 既存の詳細表示用HTMLをクリアしてリスト用HTMLに入れ替え
  if (mainContainer) {
    mainContainer.innerHTML = `
      <div id="captain-list-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="col-span-full text-center py-12">
          <svg class="animate-spin h-8 w-8 text-brand-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p class="mt-2 text-gray-500">船長情報を読み込み中...</p>
        </div>
      </div>
    `;
  }

  try {
    // 全ポイントを取得して船長情報を抽出 (効率化のため将来的には船長コレクション推奨)
    const q = collection(db, "fishing-points");
    const snapshot = await getDocs(q);
    const captainsMap = new Map();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.captain && data.captain.name) {
        // 船長名で重複排除
        if (!captainsMap.has(data.captain.name)) {
          captainsMap.set(data.captain.name, {
            name: data.captain.name,
            photoUrl: data.captain.photoUrl,
            comment: data.captain.comment,
            area: data.area // 代表エリア
          });
        }
      }
    });

    const listContainer = document.getElementById('captain-list-container');
    listContainer.innerHTML = '';

    if (captainsMap.size === 0) {
      listContainer.innerHTML = `<p class="col-span-full text-center py-10">現在登録されている船長はいません。</p>`;
      return;
    }

    captainsMap.forEach(captain => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-xl shadow-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1';
      card.innerHTML = `
        <div class="p-6 text-center">
          <div class="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-brand-50 overflow-hidden">
            <img src="${captain.photoUrl || 'https://via.placeholder.com/150'}" alt="${captain.name}" class="w-full h-full object-cover">
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-1">${captain.name} 船長</h3>
          <p class="text-brand-600 text-sm font-bold mb-4">担当エリア: ${getAreaLabel(captain.area)}</p>
          <p class="text-gray-600 text-sm italic mb-6 line-clamp-2">「${captain.comment || '安全第一でご案内します'}」</p>
          <a href="captain.html?name=${encodeURIComponent(captain.name)}" class="btn btn-primary w-full py-2 shadow-sm">詳細を見る</a>
        </div>
      `;
      listContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Error loading captain list:", error);
    if (mainContainer) mainContainer.innerHTML = `<p class="text-center text-red-500 py-10">読み込みエラーが発生しました。</p>`;
  }
}

// ヘルパー: ポイントカード作成 (詳細画面用)
function createPointCard(point) {
  const div = document.createElement('div');
  div.className = 'bg-white rounded-xl shadow-card overflow-hidden hover:shadow-lg transition-shadow duration-300';
  const thumbUrl = (point.images?.thumbnails?.[0]) || 'https://via.placeholder.com/400x300?text=No+Image';
  const areaName = getAreaLabel(point.area);

  div.innerHTML = `
    <a href="point-detail.html?id=${point.id}" class="block h-full flex flex-col">
      <div class="relative h-48">
        <img src="${thumbUrl}" alt="${point.name}" class="w-full h-full object-cover">
        <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-700 shadow">${areaName}</div>
      </div>
      <div class="p-5 flex-grow">
        <h4 class="text-lg font-bold text-gray-900 mb-2">${point.name}</h4>
        <p class="text-gray-600 text-sm line-clamp-2">${point.description || '詳細情報なし'}</p>
      </div>
    </a>
  `;
  return div;
}

function getAreaLabel(areaCode) {
  const areaMap = {
    'fukuoka': '福岡エリア', 'saga': '佐賀エリア', 'nagasaki': '長崎エリア',
    'oita': '大分エリア', 'kumamoto': '熊本エリア', 'miyazaki': '宮崎エリア', 'kagoshima': '鹿児島エリア'
  };
  return areaMap[areaCode] || areaCode; 
}

document.addEventListener('DOMContentLoaded', initCaptainPage);