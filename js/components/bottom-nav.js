// js/components/bottom-nav.js
import { auth } from '../firebase-config.js';
import { onAuthStateChanged } from "firebase/auth";

class BottomNav extends HTMLElement {
  constructor() {
    super();
    this.user = null;
  }

  connectedCallback() {
    // 現在のページを取得してアクティブ表示に使用
    this.currentPath = window.location.pathname;
    
    onAuthStateChanged(auth, (user) => {
      this.user = user;
      this.render();
    });
  }

  isActive(path) {
    if (path === '/' || path === '/index.html') {
      return this.currentPath.endsWith('/') || this.currentPath.endsWith('index.html');
    }
    return this.currentPath.includes(path);
  }

  render() {
    // 投稿ボタンのリンク先（未ログインならログインへ誘導）
    const postLink = this.user ? 'point-detail.html?id=new' : 'login.html';
    const myPageLink = this.user ? 'mypage.html' : 'login.html';

    // アクティブ時のクラス
    const activeClass = "text-brand-600";
    const inactiveClass = "text-gray-400";

    this.innerHTML = `
      <div class="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 pb-safe z-50 md:hidden">
        <div class="flex justify-around items-end h-16 pb-2">
          
          <a href="index.html" class="flex flex-col items-center justify-center w-full h-full space-y-1 ${this.isActive('index.html') ? activeClass : inactiveClass}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span class="text-[10px] font-medium">ホーム</span>
          </a>

          <a href="area.html" class="flex flex-col items-center justify-center w-full h-full space-y-1 ${this.isActive('area.html') ? activeClass : inactiveClass}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-[10px] font-medium">エリア</span>
          </a>

          <div class="relative -top-5">
            <a href="${postLink}" class="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-500/50 hover:bg-brand-700 transition-transform active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </a>
          </div>

          <a href="reviews.html" class="flex flex-col items-center justify-center w-full h-full space-y-1 ${this.isActive('reviews.html') ? activeClass : inactiveClass}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span class="text-[10px] font-medium">釣果</span>
          </a>

          <a href="${myPageLink}" class="flex flex-col items-center justify-center w-full h-full space-y-1 ${this.isActive('mypage.html') ? activeClass : inactiveClass}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span class="text-[10px] font-medium">マイページ</span>
          </a>

        </div>
      </div>
    `;
  }
}

if (!customElements.get('bottom-nav')) {
  customElements.define('bottom-nav', BottomNav);
}