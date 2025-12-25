// js/components/header.js
import { auth } from '../firebase-config.js';
import { onAuthStateChanged, signOut } from "firebase/auth";

class SiteHeader extends HTMLElement {
  constructor() {
    super();
    this.user = null;
  }

  connectedCallback() {
    // カスタム要素自体のスタイル設定
    // sticky配置でスクロールに追従
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.position = 'sticky';
    this.style.top = '0';
    this.style.zIndex = '999';

    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.render();
      this.setupEventListeners();
    });
  }

  render() {
    // デスクトップ用ナビゲーションリンク
    const desktopNav = `
      <nav class="flex items-center gap-6 text-sm font-bold text-gray-600 mr-4">
        <a href="area.html" class="hover:text-brand-600 hover:bg-gray-50 px-2 py-1.5 rounded-md transition-colors">エリアから探す</a>
        <a href="captain.html" class="hover:text-brand-600 hover:bg-gray-50 px-2 py-1.5 rounded-md transition-colors">船長紹介</a>
        <a href="reviews.html" class="hover:text-brand-600 hover:bg-gray-50 px-2 py-1.5 rounded-md transition-colors">釣果情報</a>
      </nav>
    `;

    // デスクトップ用認証エリア（右端）
    const desktopAuth = this.user
      ? `
        <div class="flex items-center gap-3 pl-3 border-l border-gray-200">
          <a href="mypage.html" class="flex items-center gap-2 text-gray-700 hover:text-brand-600 font-bold group">
            <div class="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-transparent group-hover:border-brand-200 transition-all shadow-sm">
               <!-- 画像パスをローカルの /img/default-user.jpg に変更 -->
               <img src="${this.user.photoURL || '/img/default-user.jpg'}" class="w-full h-full object-cover" onerror="this.src='/img/default-user.jpg'">
            </div>
            <span class="text-xs md:text-sm">マイページ</span>
          </a>
          <button id="header-logout-btn" class="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors px-2">ログアウト</button>
          <a href="point-detail.html?id=new" class="btn btn-primary text-xs md:text-sm px-4 py-2 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all">投稿</a>
        </div>
      `
      : `
        <div class="flex items-center gap-2 pl-3 border-l border-gray-200">
          <a href="login.html" class="text-gray-600 hover:text-brand-600 font-bold px-3 py-1.5 text-xs md:text-sm transition-colors">ログイン</a>
          <a href="signup.html" class="btn btn-primary text-xs md:text-sm px-4 py-2 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all">会員登録</a>
        </div>
      `;

    this.innerHTML = `
      <header class="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm w-full h-14 md:h-16">
        <div class="container mx-auto px-4 h-full flex items-center justify-center md:justify-between relative">
          
          <!-- ロゴエリア -->
          <a href="index.html" class="flex items-center gap-2 group hover:opacity-80 transition-opacity md:mr-auto z-20">
            <div class="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-md flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span class="text-lg md:text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap" style="font-family: 'Noto Sans JP', sans-serif;">磯リンク</span>
          </a>

          <!-- PC用 右側メニューエリア -->
          <div class="hidden md:flex items-center h-full">
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