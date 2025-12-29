// js/point-detail.js
import { auth, db } from './firebase-config.js';
import { getFishingPoint, toggleFavorite, checkFavoriteStatus } from './db-service.js';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const urlParams = new URLSearchParams(window.location.search);
const pointId = urlParams.get('id');

// DOM Elements
const heroSlider = document.getElementById('hero-slider');
const pointNameEl = document.getElementById('point-name');
const pointAreaEl = document.getElementById('point-area');
const pointDescEl = document.getElementById('point-description');
const captainNameEl = document.getElementById('captain-name');
const captainCommentEl = document.getElementById('captain-comment');
const captainPhotoEl = document.getElementById('captain-photo');
const favoriteBtn = document.getElementById('favorite-btn');
const vrLinkBtn = document.getElementById('vr-link-btn');

document.addEventListener('DOMContentLoaded', async () => {
  if (!pointId) {
    alert("ポイントIDが指定されていません");
    window.location.href = 'area.html';
    return;
  }

  // Auth Status (only for favorite button)
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      updateFavoriteButton(user.uid);
    }
    // Load Data regardless of auth (Premium content is now FREE)
    loadPointData();
  });

  // Event Listeners
  if (favoriteBtn) favoriteBtn.addEventListener('click', handleFavoriteToggle);
});

async function loadPointData() {
  try {
    const currentPointData = await getFishingPoint(pointId);
    if (!currentPointData) {
      if (pointNameEl) pointNameEl.textContent = "データが見つかりません";
      return;
    }

    renderHero(currentPointData);
    renderBasicInfo(currentPointData);
    renderCaptainInfo(currentPointData);
    initMap(currentPointData.location);

    // Hide Premium Badges (Clean up UI without touching HTML for now)
    hidePremiumBadges();

    // VR Link Logic (Unlocked for everyone)
    if (vrLinkBtn) {
       vrLinkBtn.href = `vr-view.html?id=${pointId}`;
       // Remove listener logic by simply not adding it
    }

  } catch (error) {
    console.error("Error loading point:", error);
  }
}

function hidePremiumBadges() {
    // Hide standard premium badges by class
    const badges = document.querySelectorAll('.bg-yellow-400, .bg-yellow-100');
    badges.forEach(el => {
        // Simple check to ensure we don't hide stars or other yellow elements
        if (el.textContent.includes('PREMIUM')) {
            el.style.display = 'none';
        }
    });
}

function renderHero(data) {
  if (!heroSlider) return;
  heroSlider.innerHTML = '';
  
  if (data.images && data.images.thumbnails && data.images.thumbnails.length > 0) {
    const img = document.createElement('img');
    img.src = data.images.thumbnails[0];
    img.className = 'w-full h-full object-cover animate-fade-in';
    heroSlider.appendChild(img);
  } else {
    heroSlider.innerHTML = '<div class="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">No Image</div>';
  }
}

function renderBasicInfo(data) {
  if (pointNameEl) pointNameEl.textContent = data.name;
  if (pointAreaEl) pointAreaEl.textContent = data.area || '九州';
  if (pointDescEl) pointDescEl.textContent = data.description || '説明がありません。';
}

function renderCaptainInfo(data) {
  const container = document.querySelector('.bg-white.rounded-xl.p-6.shadow-sm.mb-6.relative');
  if (!container) return;

  if (!data.captain) {
    container.style.display = 'none';
    return;
  }

  // Force Unlock: Remove lock overlay if present
  const lock = document.getElementById('captain-lock');
  if (lock) lock.style.display = 'none';

  // Render Data
  if (captainNameEl) captainNameEl.textContent = data.captain.name || '船長';
  if (captainCommentEl) {
      captainCommentEl.textContent = data.captain.comment || 'コメントなし';
      captainCommentEl.classList.remove('blur-sm');
  }
  
  if (captainPhotoEl && data.captain.photoUrl) {
    captainPhotoEl.src = data.captain.photoUrl;
  }
}

async function handleFavoriteToggle() {
  const user = auth.currentUser;
  if (!user) {
    alert("お気に入り機能を使うにはログインが必要です。");
    window.location.href = 'login.html';
    return;
  }

  const isAdded = await toggleFavorite(user.uid, pointId);
  updateFavoriteIcon(isAdded);
}

async function updateFavoriteButton(uid) {
  const isFav = await checkFavoriteStatus(uid, pointId);
  updateFavoriteIcon(isFav);
}

function updateFavoriteIcon(isFav) {
  if (!favoriteBtn) return;
  const svg = favoriteBtn.querySelector('svg');
  if (isFav) {
    svg.classList.add('text-red-500', 'fill-current');
  } else {
    svg.classList.remove('text-red-500', 'fill-current');
  }
}

function initMap(location) {
  const googleMapBtn = document.getElementById('google-map-btn');
  if (googleMapBtn && location) {
      googleMapBtn.href = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
  }
}