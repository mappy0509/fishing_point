// js/db-service.js
import { db, storage } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * 画像を圧縮するヘルパー関数 (Canvas使用)
 * @param {File} file 元の画像ファイル
 * @param {number} maxWidth 最大幅 (px)
 * @param {number} quality JPEG圧縮率 (0.0 - 1.0)
 * @returns {Promise<Blob>} 圧縮されたBlobデータ
 */
const compressImage = (file, maxWidth, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    // 画像以外はそのまま返す
    if (!file || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = (e) => reject(e);

    img.onload = () => {
      // サイズ計算 (アスペクト比維持)
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }

      // Canvasに描画してリサイズ
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Blobとして書き出し (JPEG化して容量削減)
      canvas.toBlob((blob) => {
        if (!blob) {
          // 失敗時は元ファイルを返す
          console.warn('Image compression failed, using original file.');
          resolve(file);
          return;
        }
        // 圧縮後のサイズ等のログ出力（デバッグ用）
        console.log(`Compressed: ${file.name} (${(file.size/1024).toFixed(0)}KB -> ${(blob.size/1024).toFixed(0)}KB)`);
        resolve(blob);
      }, 'image/jpeg', quality);
    };
  });
};

/**
 * 画像ファイル(またはBlob)をStorageにアップロードしてURLを取得する
 * @param {File|Blob} file アップロードするファイル
 * @param {string} path 保存先のパス
 * @returns {Promise<string>} ダウンロードURL
 */
async function uploadImage(file, path) {
  if (!file) return null;
  
  // ファイル名が存在しない場合（Blobなど）は現在時刻で生成
  const fileName = file.name || `image_${Date.now()}.jpg`;
  const storageRef = ref(storage, `${path}/${Date.now()}_${fileName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

/**
 * 新しい釣りポイントを登録する
 * @param {Object} pointData フォームから入力されたデータ
 * @param {File} vrFile 360度画像のファイルオブジェクト
 * @param {FileList} photoFiles サムネイル画像のFileList
 * @param {File} captainPhotoFile 船長の顔写真ファイル
 */
export async function addFishingPoint(pointData, vrFile, photoFiles, captainPhotoFile) {
  try {
    console.log("Starting compression and upload process...");

    // 1. 画像の圧縮処理 (用途に合わせて設定)
    
    // VR画像: 4K画質相当(4096px)は維持し、高画質設定(0.85)で保存
    const vrCompressedPromise = vrFile 
      ? compressImage(vrFile, 4096, 0.85) 
      : Promise.resolve(null);

    // 船長画像: スマホ表示メインなので幅800pxあれば十分
    const captainCompressedPromise = captainPhotoFile 
      ? compressImage(captainPhotoFile, 800, 0.7) 
      : Promise.resolve(null);

    // サムネイル群: Full HD程度(1920px)に抑える
    const photoCompressedPromises = [];
    if (photoFiles && photoFiles.length > 0) {
      for (let i = 0; i < photoFiles.length; i++) {
        photoCompressedPromises.push(compressImage(photoFiles[i], 1920, 0.7));
      }
    }

    // 圧縮の完了を待機
    const [vrBlob, captainBlob, ...photoBlobs] = await Promise.all([
      vrCompressedPromise,
      captainCompressedPromise,
      ...photoCompressedPromises
    ]);

    // 2. Storageへのアップロード処理 (並行実行)
    const vrUploadPromise = uploadImage(vrBlob, 'vr_images');
    const captainUploadPromise = uploadImage(captainBlob, 'captain_images');
    
    const photoUploadPromises = photoBlobs.map(blob => uploadImage(blob, 'point_photos'));

    // 全てのアップロード完了を待機
    const [vrUrl, captainPhotoUrl, ...photoUrls] = await Promise.all([
      vrUploadPromise,
      captainUploadPromise,
      ...photoUploadPromises
    ]);

    // 3. 保存するデータの整形
    const docData = {
      name: pointData.name,
      area: pointData.area,
      location: {
        lat: parseFloat(pointData.lat),
        lng: parseFloat(pointData.lng)
      },
      description: pointData.description || "",
      images: {
        vr: vrUrl,
        thumbnails: photoUrls
      },
      captain: {
        name: pointData.captainName,
        comment: pointData.captainComment,
        photoUrl: captainPhotoUrl
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // 4. Firestoreへデータ保存
    const docRef = await addDoc(collection(db, "fishing-points"), docData);
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;

  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
}