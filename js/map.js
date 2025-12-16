// js/map.js
import { db } from './firebase-config.js';
import { collection, getDocs } from "firebase/firestore";

let map;
let markers = [];
let infoWindow;

// グローバル関数として定義
window.initOverviewMap = async () => {
  const mapElement = document.getElementById('overview-map');
  if (!mapElement) return;

  // 初期位置 (九州全体が見えるように)
  const defaultLocation = { lat: 33.3, lng: 130.5 };
  
  map = new google.maps.Map(mapElement, {
    center: defaultLocation,
    zoom: 8,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false
  });

  infoWindow = new google.maps.InfoWindow();

  // Firestoreからデータを取得してピンを立てる
  await loadFishingPoints();
};

async function loadFishingPoints() {
  try {
    const querySnapshot = await getDocs(collection(db, "fishing-points"));
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.location && data.location.lat && data.location.lng) {
        createMarker(doc.id, data);
      }
    });
  } catch (error) {
    console.error("Error fetching points:", error);
    // エラー時はユーザーに通知せずコンソールのみ（またはToast表示など）
  }
}

function createMarker(id, data) {
  const position = { 
    lat: parseFloat(data.location.lat), 
    lng: parseFloat(data.location.lng) 
  };

  const marker = new google.maps.Marker({
    position: position,
    map: map,
    title: data.name
  });

  // クリック時の情報ウィンドウ
  marker.addListener("click", () => {
    const contentString = `
      <div class="p-2 min-w-[200px]">
        <h3 class="font-bold text-lg text-gray-900 mb-1">${data.name}</h3>
        <p class="text-xs text-gray-500 mb-2">${getAreaName(data.area)}</p>
        ${data.images && data.images.thumbnails && data.images.thumbnails[0] ? 
          `<img src="${data.images.thumbnails[0]}" class="w-full h-24 object-cover rounded mb-2" alt="${data.name}">` : ''}
        <a href="point-detail.html?id=${id}" class="block w-full text-center bg-brand-600 text-white text-sm py-2 rounded hover:bg-brand-700 transition">
          詳細を見る
        </a>
      </div>
    `;

    infoWindow.setContent(contentString);
    infoWindow.open({
      anchor: marker,
      map,
      shouldFocus: false,
    });
  });

  markers.push(marker);
}

// エリアコードを日本語名に変換するヘルパー
function getAreaName(areaCode) {
  const areas = {
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
  return areas[areaCode] || '九州エリア';
}