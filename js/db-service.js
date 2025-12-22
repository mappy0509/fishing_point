// js/db-service.js
import { db, storage } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, doc, setDoc, deleteDoc, getDoc, getDocs, query, orderBy, limit, where } from "firebase/firestore";
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

export async function addFishingPoint(pointData, vrFile, photoFiles, captainPhotoFile) {
  try {
    console.log("Starting compression and upload process...");

    const vrCompressedPromise = vrFile ? compressImage(vrFile, 4096, 0.85) : Promise.resolve(null);
    const captainCompressedPromise = captainPhotoFile ? compressImage(captainPhotoFile, 800, 0.7) : Promise.resolve(null);
    const photoCompressedPromises = [];
    if (photoFiles && photoFiles.length > 0) {
      for (let i = 0; i < photoFiles.length; i++) {
        photoCompressedPromises.push(compressImage(photoFiles[i], 1920, 0.7));
      }
    }

    const [vrBlob, captainBlob, ...photoBlobs] = await Promise.all([
      vrCompressedPromise,
      captainCompressedPromise,
      ...photoCompressedPromises
    ]);

    const vrUploadPromise = uploadImage(vrBlob, 'vr_images');
    const captainUploadPromise = uploadImage(captainBlob, 'captain_images');
    const photoUploadPromises = photoBlobs.map(blob => uploadImage(blob, 'point_photos'));

    const [vrUrl, captainPhotoUrl, ...photoUrls] = await Promise.all([
      vrUploadPromise,
      captainUploadPromise,
      ...photoUploadPromises
    ]);

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

// --- お気に入り機能関連 ---

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

// --- 口コミ・釣果機能関連 ---

export async function addReview(pointId, reviewData) {
  if (!pointId) throw new Error("Point ID is required");
  const reviewsRef = collection(db, "fishing-points", pointId, "reviews");
  await addDoc(reviewsRef, {
    ...reviewData,
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

// --- 船長・検索関連 ---

/**
 * 船長名でポイントを検索して取得する
 * @param {string} captainName 
 * @returns {Promise<Array>}
 */
export async function getPointsByCaptainName(captainName) {
  if (!captainName) return [];
  
  try {
    const pointsRef = collection(db, "fishing-points");
    // captain.name フィールドが一致するものを検索
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