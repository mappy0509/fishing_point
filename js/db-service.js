// js/db-service.js
import { db, storage } from './firebase-config.js';
import { 
  collection, addDoc, serverTimestamp, doc, setDoc, deleteDoc, getDoc, getDocs, 
  query, orderBy, limit, where, updateDoc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- 画像圧縮・アップロード関連 ---

const compressImage = (file, maxWidth, quality = 0.7) => {
  return new Promise((resolve, reject) => {
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
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) {
          console.warn('Image compression failed, using original file.');
          resolve(file);
          return;
        }
        console.log(`Compressed: ${file.name} (${(file.size/1024).toFixed(0)}KB -> ${(blob.size/1024).toFixed(0)}KB)`);
        resolve(blob);
      }, 'image/jpeg', quality);
    };
  });
};

async function uploadImage(file, path) {
  if (!file) return null;
  const fileName = file.name || `image_${Date.now()}.jpg`;
  const storageRef = ref(storage, `${path}/${Date.now()}_${fileName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// --- ポイント管理関連 ---

// 新規登録
export async function addFishingPoint(pointData, vrFile, photoFiles, captainPhotoFile, onProgress) {
  try {
    console.log("Starting upload process...");
    
    if (onProgress) onProgress("画像の準備をしています...");

    // 360度画像は圧縮しない（高速化 & 画質維持）
    const vrBlobPromise = Promise.resolve(vrFile); 

    const captainCompressedPromise = captainPhotoFile ? compressImage(captainPhotoFile, 800, 0.7) : Promise.resolve(null);
    const photoCompressedPromises = [];
    if (photoFiles && photoFiles.length > 0) {
      for (let i = 0; i < photoFiles.length; i++) {
        photoCompressedPromises.push(compressImage(photoFiles[i], 1920, 0.7));
      }
    }

    const [vrBlob, captainBlob, ...photoBlobs] = await Promise.all([
      vrBlobPromise,
      captainCompressedPromise,
      ...photoCompressedPromises
    ]);

    if (onProgress) onProgress("画像をクラウドへアップロードしています... (通信中)");

    const vrUploadPromise = uploadImage(vrBlob, 'vr_images');
    const captainUploadPromise = uploadImage(captainBlob, 'captain_images');
    const photoUploadPromises = photoBlobs.map(blob => uploadImage(blob, 'point_photos'));

    const [vrUrl, captainPhotoUrl, ...photoUrls] = await Promise.all([
      vrUploadPromise,
      captainUploadPromise,
      ...photoUploadPromises
    ]);

    if (onProgress) onProgress("データベースに情報を登録しています...");

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

    const docRef = await addDoc(collection(db, "fishing-points"), docData);
    return docRef.id;

  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
}

// 取得
export async function getFishingPoint(pointId) {
  if (!pointId) return null;
  try {
    const docRef = doc(db, "fishing-points", pointId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching point:", error);
    return null;
  }
}

// 全件取得 (管理画面用)
export async function getAllFishingPoints() {
  try {
    const q = query(collection(db, "fishing-points"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all points:", error);
    return [];
  }
}

// 削除
export async function deleteFishingPoint(pointId) {
  if (!pointId) return;
  try {
    await deleteDoc(doc(db, "fishing-points", pointId));
  } catch (error) {
    console.error("Error deleting point:", error);
    throw error;
  }
}

// 更新
export async function updateFishingPoint(pointId, pointData, vrFile, photoFiles, captainPhotoFile, onProgress) {
  if (!pointId) throw new Error("Point ID is required");

  try {
    console.log("Starting update process...");
    if (onProgress) onProgress("更新データの準備中...");

    let newVrUrl = null;
    if (vrFile) {
      if (onProgress) onProgress("新しい360度画像をアップロード中...");
      newVrUrl = await uploadImage(vrFile, 'vr_images');
    }

    let newCaptainUrl = null;
    if (captainPhotoFile) {
      const compressed = await compressImage(captainPhotoFile, 800, 0.7);
      newCaptainUrl = await uploadImage(compressed, 'captain_images');
    }

    let newPhotoUrls = [];
    if (photoFiles && photoFiles.length > 0) {
      if (onProgress) onProgress("新しい写真を処理中...");
      for (let i = 0; i < photoFiles.length; i++) {
        const compressed = await compressImage(photoFiles[i], 1920, 0.7);
        const url = await uploadImage(compressed, 'point_photos');
        newPhotoUrls.push(url);
      }
    }

    if (onProgress) onProgress("データベースを更新しています...");
    
    const currentDoc = await getDoc(doc(db, "fishing-points", pointId));
    const currentData = currentDoc.data();

    const updateData = {
      name: pointData.name,
      area: pointData.area,
      location: {
        lat: parseFloat(pointData.lat),
        lng: parseFloat(pointData.lng)
      },
      description: pointData.description || "",
      updatedAt: serverTimestamp(),
      captain: {
        name: pointData.captainName,
        comment: pointData.captainComment,
        photoUrl: newCaptainUrl || currentData.captain?.photoUrl || null
      }
    };

    const finalVrUrl = newVrUrl || currentData.images?.vr;
    const finalThumbnails = (newPhotoUrls.length > 0) ? newPhotoUrls : (currentData.images?.thumbnails || []);

    updateData.images = {
      vr: finalVrUrl,
      thumbnails: finalThumbnails
    };

    await updateDoc(doc(db, "fishing-points", pointId), updateData);

  } catch (e) {
    console.error("Error updating document: ", e);
    throw e;
  }
}

// --- お気に入り・レビュー・検索関連 (変更なし) ---

export async function toggleFavorite(userId, pointId) {
  if (!userId || !pointId) return false;
  const favRef = doc(db, "users", userId, "favorites", pointId);
  const docSnap = await getDoc(favRef);

  if (docSnap.exists()) {
    await deleteDoc(favRef);
    return false;
  } else {
    await setDoc(favRef, {
      addedAt: serverTimestamp(),
      pointId: pointId
    });
    return true;
  }
}

export async function checkFavoriteStatus(userId, pointId) {
  if (!userId || !pointId) return false;
  const favRef = doc(db, "users", userId, "favorites", pointId);
  const docSnap = await getDoc(favRef);
  return docSnap.exists();
}

export async function getUserFavorites(userId) {
  if (!userId) return [];
  const q = collection(db, "users", userId, "favorites");
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.id);
}

export async function addReview(pointId, reviewData) {
  if (!pointId) throw new Error("Point ID is required");

  let denormalizedData = {};
  try {
    const pointRef = doc(db, "fishing-points", pointId);
    const pointSnap = await getDoc(pointRef);
    
    if (pointSnap.exists()) {
      const p = pointSnap.data();
      denormalizedData = {
        pointName: p.name,
        pointArea: p.area,
        pointThumbnail: p.images?.thumbnails?.[0] || null
      };
    }
  } catch (error) {
    console.warn("Failed to fetch point info for review denormalization:", error);
  }

  const reviewsRef = collection(db, "fishing-points", pointId, "reviews");
  await addDoc(reviewsRef, {
    ...reviewData,
    ...denormalizedData, 
    createdAt: serverTimestamp()
  });
}

export async function getReviews(pointId) {
  if (!pointId) return [];
  const reviewsRef = collection(db, "fishing-points", pointId, "reviews");
  const q = query(reviewsRef, orderBy("createdAt", "desc"), limit(50));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getPointsByCaptainName(captainName) {
  if (!captainName) return [];
  try {
    const pointsRef = collection(db, "fishing-points");
    const q = query(pointsRef, where("captain.name", "==", captainName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching points by captain:", error);
    return [];
  }
}