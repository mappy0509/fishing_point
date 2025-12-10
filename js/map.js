// mappy0509/fishing_point/fishing_point-c25eb2a906a50e9daf0f0ad8bd3b1711949446b2/js/map.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// エリア名のマッピング
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

let map;
let markers = [];
let pointsData = [];

/**
 * Google Maps APIによって呼び出される初期化関数
 * (index.htmlのscriptタグ内のcallback=initMapで指定)
 */
window.initMap = async function() {
  const mapElement = document.getElementById('google-map');
  if (!mapElement) return;

  // デフォルトの中心座標（九州全体が見える位置）
  const defaultCenter = { lat: 33.3, lng: 130.5 };

  // マップの初期化
  map = new google.maps.Map(mapElement, {
    center: defaultCenter,
    zoom: 8,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      {
        "featureType": "poi",
        "stylers": [{ "visibility": "off" }]
      }
    ]
  });

  // データの取得とピンの配置
  await fetchAndDisplayPoints();
};

/**
 * Firestoreからデータを取得して表示する
 */
async function fetchAndDisplayPoints() {
  const sidebarContainer = document.getElementById('map-sidebar-list');
  if (!sidebarContainer) return;

  try {
    const q = query(collection(db, "fishing-points"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    pointsData = [];
    querySnapshot.forEach((doc) => {
      pointsData.push({ id: doc.id, ...doc.data() });
    });

    sidebarContainer.innerHTML = '';

    if (pointsData.length === 0) {
      sidebarContainer.innerHTML = '<div class="text-center py-8 text-gray-500">ポイントが見つかりません</div>';
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    // ポイントごとにマーカーとリストアイテムを生成
    pointsData.forEach(point => {
      if (point.location && point.location.lat && point.location.lng) {
        // 1. マーカーの作成
        const position = { lat: point.location.lat, lng: point.location.lng };
        const marker = new google.maps.Marker({
          position: position,
          map: map,
          title: point.name,
          animation: google.maps.Animation.DROP
        });

        // 情報ウィンドウの設定
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 4px;">
              <h3 style="font-weight:bold; margin-bottom:4px;">${point.name}</h3>
              <p style="font-size:12px; color:#666;">${areaNameMap[point.area] || '九州エリア'}</p>
              <a href="point-detail.html?id=${point.id}" style="color:#0ea5e9; font-size:12px; text-decoration:underline;">詳細を見る</a>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        markers.push(marker);
        bounds.extend(position);

        // 2. サイドバーリストの生成
        const listItem = document.createElement('div');
        listItem.className = "cursor-pointer bg-white p-3 rounded-lg border border-gray-200 hover:border-brand-500 hover:shadow-md transition group mb-3";
        listItem.innerHTML = `
          <a href="point-detail.html?id=${point.id}" class="flex gap-3 block">
            <img src="${point.images?.thumbnails?.[0] || 'https://placehold.co/100x100?text=No+Img'}" class="w-20 h-20 rounded object-cover flex-shrink-0">
            <div class="flex-grow">
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
          </a>
        `;

        // リストアイテムにホバー時の動作（マップの中心を移動など）
        listItem.addEventListener('mouseenter', () => {
          marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(() => marker.setAnimation(null), 750);
        });

        sidebarContainer.appendChild(listItem);
      }
    });

    // ピンが複数ある場合は全体が収まるようにズーム調整
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }

  } catch (error) {
    console.error("Error fetching points:", error);
    sidebarContainer.innerHTML = '<div class="text-center py-8 text-red-500">読み込みエラーが発生しました</div>';
  }
}