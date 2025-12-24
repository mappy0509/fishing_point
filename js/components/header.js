// js/components/header.js
import { auth } from '../firebase-config.js';
import { onAuthStateChanged, signOut } from "firebase/auth";

class SiteHeader extends HTMLElement {
  constructor() {
    super();
    this.user = null;
  }

  connectedCallback() {
    // 【修正】カスタム要素自体をブロック要素・Sticky配置にし、高さを確保する
    // これにより、後続のコンテンツ（ヒーロー画像など）がヘッダーの下に潜り込むのを防ぎます
    this.style.display = 'block';
    this.style.position = 'sticky';
    this.style.top = '0';
    this.style.zIndex = '50';
    this.style.width = '100%';

    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.render();
      this.setupEventListeners();
    });
  }

  render() {
    // デスクトップ用ナビゲーション
    const desktopNav = `
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
        <a href="area.html" class="hover:text-brand-600 transition-colors">エリアから探す</a>
        <a href="captain.html" class="hover:text-brand-600 transition-colors">船長紹介</a>
        <a href="reviews.html" class="hover:text-brand-600 transition-colors">釣果情報</a>
      </nav>
    `;

    // デスクトップ用認証ボタン
    const desktopAuth = this.user
      ? `
        <div class="hidden md:flex items-center gap-4">
          <a href="mypage.html" class="flex items-center gap-2 text-gray-700 hover:text-brand-600 font-medium">
            <div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
               <img src="${this.user.photoURL || 'https://via.placeholder.com/150'}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9IiNjY2MiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTI0IDIwLjk5M1YyNEgwdi0yLjk5NkExNC45NzcgMTQuOTc3IDAgMDExMi4wMDQgMTVjNC45MDQgMCA5LjI2IDIuMzU0IDExLjk5NiA1Ljk5M3pNMTYuMDAyIDguOTk5YTQgNCAwIDExLTggMCA0IDQgMCAwMTggMHoiIC8+PC9zdmc+'">
            </div>
            <span>マイページ</span>
          </a>
          <button id="header-logout-btn" class="text-xs text-gray-500 hover:text-red-500">ログアウト</button>
          <a href="point-detail.html?id=new" class="btn btn-primary text-sm px-4 py-2 shadow-md">投稿する</a>
        </div>
      `
      : `
        <div class="hidden md:flex items-center gap-2">
          <a href="login.html" class="text-gray-600 hover:text-brand-600 font-medium px-3 py-2">ログイン</a>
          <a href="signup.html" class="btn btn-primary text-sm px-4 py-2 shadow-md">会員登録</a>
        </div>
      `;

    // 【修正ポイント】
    // 1. justify-between: ロゴ(左)とナビ(右)を両端に配置
    // 2. モバイルロゴ: absolute配置で完全中央揃え
    // 3. デスクトップ: ロゴをstaticに戻し、ナビと認証ボタンを右側グループ(div)にまとめる
    this.innerHTML = `
      <header class="bg-white border-b border-gray-200 shadow-sm pt-[env(safe-area-inset-top)] w-full h-14 md:h-16 flex items-center">
        <div class="container mx-auto px-4 relative flex items-center justify-between h-full">
          
          <a href="index.html" class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 md:static md:transform-none md:flex md:items-center md:gap-2 group z-10">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span class="text-lg md:text-xl font-bold text-gray-900 tracking-tight">磯リンク</span>
            </div>
          </a>

          <div class="hidden md:flex items-center gap-8 ml-auto">
            ${desktopNav}
            ${desktopAuth}
          </div>

          </div>
      </header>
    `;
  }

  setupEventListeners() {
    const logoutBtn = this.querySelector('#header-logout-btn');

    const handleLogout = async (e) => {
      e.preventDefault();
      if (confirm('ログアウトしますか？')) {
        await signOut(auth);
        window.location.href = 'index.html';
      }
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  }
}

if (!customElements.get('site-header')) {
  customElements.define('site-header', SiteHeader);
}