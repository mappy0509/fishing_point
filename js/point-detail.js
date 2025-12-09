// js/point-detail.js
import { db } from './firebase-config.js';
import { doc, getDoc } from "firebase/firestore";

/**
 * URLパラメータからIDを取得する
 */
function getPointIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * ポイント詳細を表示する
 */
async function renderPointDetail() {
  const pointId = getPointIdFromUrl();

  if (!pointId) {
    alert('ポイントIDが指定されていません。');
    window.location.href = 'area.html';
    return;
  }

  try {
    const docRef = doc(db, "fishing-points", pointId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      updatePageContent(data);
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
 * 取得したデータでページの各要素を更新する
 */
function updatePageContent(data) {
  // タイトルとメタデータ
  document.title = `${data.name} - 磯リンク`;
  
  // メイン情報の更新
  setText('point-title', data.name);
  setText('point-area-label', getAreaLabel(data.area));
  
  // 画像処理
  // 360度画像の背景設定 (CSS変数を操作またはstyle属性を変更)
  const heroSection = document.getElementById('hero-section-bg');
  if (heroSection && data.images?.vr) {
    const img = heroSection.querySelector('img');
    if(img) img.src = data.images.vr;
  }

  // 船長情報
  if (data.captain) {
    setText('captain-name', `${data.captain.name}`);
    setText('captain-comment', `「${data.captain.comment}」`);
    if (data.captain.photoUrl) {
      const captainImg = document.getElementById('captain-image');
      if (captainImg) captainImg.src = data.captain.photoUrl;
    }
  }

  // Googleマップリンクの更新 (緯度経度がある場合)
  if (data.location) {
    const mapLink = document.getElementById('google-map-link');
    if (mapLink) {
      mapLink.href = `https://www.google.com/maps/search/?api=1&query=${data.location.lat},${data.location.lng}`;
    }
    // 静的マップ画像の更新（APIキーがあれば）
    const staticMap = document.getElementById('static-map-img');
    if (staticMap) {
      // 注: 実際の運用ではAPIキーが必要です
      // staticMap.src = `https://maps.googleapis.com/maps/api/staticmap?center=${data.location.lat},${data.location.lng}&zoom=14&size=800x400&maptype=satellite&key=YOUR_API_KEY`;
    }
  }
}

// ヘルパー関数：テキスト設定
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ヘルパー関数：エリア名の変換（簡易版）
function getAreaLabel(areaCode) {
  // area.jsと同様のマッピングが必要ですが、簡略化のためそのまま返すか、
  // 共通の定数ファイルを作ってインポートするのがベストです。
  return areaCode; 
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', renderPointDetail);