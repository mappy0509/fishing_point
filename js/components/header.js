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
    // 認証ユーザー向けリンク
    const authLinks = this.user
      ? `
        <a href="mypage.html" class="text-gray-600 hover:text-brand-600 font-medium px-3 py-2 transition-colors">マイページ</a>
        <button id="header-logout-btn" type="button" class="text-gray-600 hover:text-red-500 font-medium px-3 py-2 transition-colors">ログアウト</button>
        <a href="point-detail.html?id=new" class="hidden md:inline-flex btn btn-primary text-sm px-4 py-2 ml-2">投稿する</a>
      `
      : `
        <a href="login.html" class="text-gray-600 hover:text-brand-600 font-medium px-3 py-2 transition-colors">ログイン</a>
        <a href="signup.html" class="btn btn-primary text-sm px-4 py-2 ml-2 shadow-md">会員登録</a>
      `;

    // モバイルメニュー（認証状態反映）
    const mobileAuthLinks = this.user
      ? `
        <a href="mypage.html" class="block text-gray-700 hover:text-brand-600 font-medium py-3 border-b border-gray-100">マイページ</a>
        <button id="mobile-logout-btn" type="button" class="w-full text-left block text-red-500 hover:text-red-700 font-medium py-3 border-b border-gray-100">ログアウト</button>
      `
      : `
        <a href="login.html" class="block text-gray-700 hover:text-brand-600 font-medium py-3 border-b border-gray-100">ログイン</a>
        <a href="signup.html" class="block text-brand-600 hover:text-brand-700 font-bold py-3 border-b border-gray-100">無料会員登録</a>
      `;

    // 共通ナビゲーション項目 (ここを修正)
    const navItems = `
      <a href="area.html" class="text-gray-600 hover:text-brand-600 font-medium px-3 py-2 transition-colors">エリアから探す</a>
      <a href="captain.html" class="text-gray-600 hover:text-brand-600 font-medium px-3 py-2 transition-colors">船長紹介</a>
      <a href="reviews.html" class="text-gray-600 hover:text-brand-600 font-medium px-3 py-2 transition-colors">釣果情報</a>
    `;
    
    const mobileNavItems = `
      <a href="area.html" class="block text-gray-700 hover:text-brand-600 font-medium py-3 border-b border-gray-100">エリアから探す</a>
      <a href="captain.html" class="block text-gray-700 hover:text-brand-600 font-medium py-3 border-b border-gray-100">船長紹介</a>
      <a href="reviews.html" class="block text-gray-700 hover:text-brand-600 font-medium py-3 border-b border-gray-100">釣果情報</a>
    `;

    this.innerHTML = `
      <div id="header-wrapper" class="bg-white/95 backdrop-blur-sm shadow-sm">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-16 md:h-20">
            
            <a href="index.html" class="flex items-center gap-2 group relative z-10">
              <div class="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-brand">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span class="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">磯リンク</span>
            </a>

            <nav class="hidden md:flex items-center gap-1 relative z-10">
              ${navItems}
              <div class="h-6 w-px bg-gray-200 mx-2"></div>
              ${authLinks}
            </nav>

            <button id="mobile-menu-btn" type="button" class="md:hidden p-2 text-gray-600 hover:text-brand-600 transition-colors focus:outline-none relative z-20">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>

        <div id="mobile-menu" class="hidden md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-gray-100 z-10">
          <div class="container mx-auto px-4 py-4 flex flex-col">
            ${mobileNavItems}
            ${mobileAuthLinks}
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const mobileMenuBtn = this.querySelector('#mobile-menu-btn');
    const mobileMenu = this.querySelector('#mobile-menu');
    const logoutBtn = this.querySelector('#header-logout-btn');
    const mobileLogoutBtn = this.querySelector('#mobile-logout-btn');

    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        mobileMenu.classList.toggle('hidden');
        
        const isOpen = !mobileMenu.classList.contains('hidden');
        mobileMenuBtn.innerHTML = isOpen 
          ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>`;
      });
    }

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