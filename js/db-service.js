// js/db-service.js
import { db, storage } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * 画像ファイルをStorageにアップロードしてURLを取得するヘルパー関数
 * @param {File} file アップロードするファイル
 * @param {string} path 保存先のパス
 * @returns {Promise<string>} ダウンロードURL
 */
async function uploadImage(file, path) {
  if (!file) return null;
  const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
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
    // 1. 画像のアップロード処理（並行して実行）
    const vrUploadPromise = vrFile ? uploadImage(vrFile, 'vr_images') : Promise.resolve(null);
    const captainUploadPromise = captainPhotoFile ? uploadImage(captainPhotoFile, 'captain_images') : Promise.resolve(null);
    
    // サムネイル画像のアップロード（複数）
    const photoUploadPromises = [];
    if (photoFiles && photoFiles.length > 0) {
      for (let i = 0; i < photoFiles.length; i++) {
        photoUploadPromises.push(uploadImage(photoFiles[i], 'point_photos'));
      }
    }

    // 全てのアップロード完了を待つ
    const [vrUrl, captainPhotoUrl, ...photoUrls] = await Promise.all([
      vrUploadPromise,
      captainUploadPromise,
      ...photoUploadPromises
    ]);

    // 2. 保存するデータの整形
    const docData = {
      name: pointData.name,
      area: pointData.area,
      location: {
        lat: parseFloat(pointData.lat),
        lng: parseFloat(pointData.lng)
      },
      description: pointData.description || "", // 必要に応じて追加可能
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

    // 3. Firestoreへデータ保存
    const docRef = await addDoc(collection(db, "fishing-points"), docData);
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;

  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
}