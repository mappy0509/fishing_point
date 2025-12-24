// js/components/header.js
import { auth } from '../firebase-config.js';
import { onAuthStateChanged, signOut } from "firebase/auth";

class SiteHeader extends HTMLElement {
  constructor() {
    super();
    this.user = null;
  }

  connectedCallback() {
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.render();
      this.setupEventListeners();
    });
  }

  render() {
    // デスクトップ用ナビゲーション (モバイルでは非表示)
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
            <div class="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
               <svg class="w-full h-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
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

    // モバイル用メニューの中身 (主要ナビはボトムへ移動したため、サブメニュー的役割)
    const mobileMenuContent = `
      <div class="py-2">
        <p class="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">メニュー</p>
        <a href="captain.html" class="block px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100">船長紹介</a>
        <a href="payment.html" class="block px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100">プレミアム会員</a>
        <a href="terms.html" class="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">利用規約</a>
        <a href="privacy.html" class="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">プライバシーポリシー</a>
        <a href="admin.html" class="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">管理者ページ</a>
        
        ${this.user ? `
          <button id="mobile-logout-btn" class="w-full text-left block px-4 py-3 text-sm text-red-500 hover:bg-red-50 mt-2 border-t border-gray-100">ログアウト</button>
        ` : `
          <div class="p-4 grid grid-cols-2 gap-3 mt-2 border-t border-gray-100">
            <a href="login.html" class="btn bg-white border border-gray-300 text-gray-700 text-center py-2 text-sm">ログイン</a>
            <a href="signup.html" class="btn btn-primary text-center py-2 text-sm">会員登録</a>
          </div>
        `}
      </div>
    `;

    this.innerHTML = `
      <header class="sticky top-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm transition-all duration-300" id="main-header">
        <div class="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          
          <a href="index.html" class="flex items-center gap-2 group">
            <div class="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span class="text-lg md:text-xl font-bold text-gray-900 tracking-tight">磯リンク</span>
          </a>

          ${desktopNav}
          ${desktopAuth}

          <button id="mobile-menu-btn" type="button" class="md:hidden p-2 -mr-2 text-gray-500 hover:text-gray-900 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>

        <div id="mobile-menu" class="fixed inset-0 z-50 transform translate-x-full transition-transform duration-300 md:hidden">
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" id="mobile-menu-backdrop"></div>
          <div class="absolute top-0 right-0 w-64 h-full bg-white shadow-2xl overflow-y-auto">
            <div class="flex items-center justify-between p-4 border-b border-gray-100">
              <span class="font-bold text-gray-900">メニュー</span>
              <button id="mobile-menu-close" class="p-1 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            ${mobileMenuContent}
          </div>
        </div>
      </header>
    `;
  }

  setupEventListeners() {
    const mobileMenuBtn = this.querySelector('#mobile-menu-btn');
    const mobileMenuClose = this.querySelector('#mobile-menu-close');
    const mobileMenuBackdrop = this.querySelector('#mobile-menu-backdrop');
    const mobileMenu = this.querySelector('#mobile-menu');
    const logoutBtn = this.querySelector('#header-logout-btn');
    const mobileLogoutBtn = this.querySelector('#mobile-logout-btn');

    const toggleMenu = () => {
      if (mobileMenu.classList.contains('translate-x-full')) {
        mobileMenu.classList.remove('translate-x-full');
      } else {
        mobileMenu.classList.add('translate-x-full');
      }
    };

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMenu);
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', toggleMenu);
    if (mobileMenuBackdrop) mobileMenuBackdrop.addEventListener('click', toggleMenu);

    const handleLogout = async (e) => {
      e.preventDefault();
      if (confirm('ログアウトしますか？')) {
        await signOut(auth);
        window.location.href = 'index.html';
      }
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
  }
}

if (!customElements.get('site-header')) {
  customElements.define('site-header', SiteHeader);
}