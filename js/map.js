// js/map.js
import { db } from './firebase-config.js';
import { collection, getDocs, query } from "firebase/firestore";

let map;
let markers = [];
let infoWindow;

// エリアごとの中心座標定義
const areaCenters = {
  'fukuoka': { lat: 33.60639, lng: 130.41806, zoom: 9 },
  'saga': { lat: 33.2635, lng: 130.3008, zoom: 9 },
  'nagasaki': { lat: 32.7503, lng: 129.8777, zoom: 9 },
  'oita': { lat: 33.2382, lng: 131.6126, zoom: 9 },
  'kumamoto': { lat: 32.8031, lng: 130.7079, zoom: 9 },
  'miyazaki': { lat: 31.9077, lng: 131.4202, zoom: 9 },
  'kagoshima': { lat: 31.5966, lng: 130.5571, zoom: 9 },
  'default': { lat: 33.0, lng: 130.5, zoom: 7 } // 九州全体
};

// Google Maps APIのコールバックとしてグローバルに公開
window.initOverviewMap = async function() {
  const mapEl = document.getElementById('overview-map');
  if (!mapEl) return;

  // URLパラメータからエリアを取得
  const urlParams = new URLSearchParams(window.location.search);
  const areaParam = urlParams.get('area');
  
  const initialSetting = areaCenters[areaParam] || areaCenters['default'];

  // マップ初期化
  map = new google.maps.Map(mapEl, {
    center: { lat: initialSetting.lat, lng: initialSetting.lng },
    zoom: initialSetting.zoom,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [ // 少しカスタムしたスタイル（海を見やすく）
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#aadaff" }]
      }
    ]
  });

  infoWindow = new google.maps.InfoWindow();

  // ポイントデータを取得してピンを立てる
  await loadAndDisplayPoints(areaParam);
};

async function loadAndDisplayPoints(filterArea) {
  try {
    const q = query(collection(db, "fishing-points"));
    const snapshot = await getDocs(q);
    
    // マーカーをクリア
    markers.forEach(m => m.setMap(null));
    markers = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // 位置情報がないデータはスキップ
      if (!data.lat || !data.lng) return;

      // フィルタリング（指定エリアがある場合、エリアコードの前方一致で判定）
      if (filterArea && data.area && !data.area.startsWith(filterArea)) {
        return;
      }

      const marker = new google.maps.Marker({
        position: { lat: parseFloat(data.lat), lng: parseFloat(data.lng) },
        map: map,
        title: data.name,
        // アイコンをカスタム（魚のアイコンなどがあれば設定）
        // icon: '/img/pin.png' 
      });

      // クリックイベント
      marker.addListener("click", () => {
        const contentString = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">${data.name}</h3>
            ${data.images && data.images.thumbnails && data.images.thumbnails.length > 0 
              ? `<img src="${data.images.thumbnails[0]}" style="width:100%; height:100px; object-fit:cover; border-radius:4px; margin-bottom:8px;" onerror="this.style.display='none'">` 
              : ''}
            <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${data.area || ''}</p>
            <a href="point-detail.html?id=${doc.id}" style="display:block; text-align:center; background:#0284c7; color:white; text-decoration:none; padding:6px; border-radius:4px; font-size:12px; font-weight:bold;">詳細を見る</a>
          </div>
        `;
        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);
      });

      markers.push(marker);
    });

  } catch (error) {
    console.error("Error loading points for map:", error);
  }
}

// フィルタリングボタンのイベントリスナー設定（overview-map.html内のボタン用）
document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = document.querySelectorAll('.overview-filter-btn'); // HTML側でクラス追加が必要
  if (filterButtons.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const area = e.target.getAttribute('data-area');
        const setting = areaCenters[area] || areaCenters['default'];
        
        map.panTo({ lat: setting.lat, lng: setting.lng });
        map.setZoom(setting.zoom);
        loadAndDisplayPoints(area === 'all' ? null : area);
      });
    });
  }
});