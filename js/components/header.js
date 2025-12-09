import { monitorAuthState, logoutUser } from '../auth-service.js';

class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupAuthListener();
  }

  render() {
    this.innerHTML = `
      <header class="fixed w-full top-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-100" id="main-header">
        <div class="container mx-auto px-4 h-16 flex items-center justify-between">
          <a href="index.html" class="flex items-center gap-2 group">
            <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-500/30 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">
              磯リンク
            </span>
          </a>

          <nav class="hidden md:flex items-center gap-8">
            <a href="index.html" class="text-gray-600 hover:text-brand-600 font-medium transition-colors">ホーム</a>
            <a href="area.html" class="text-gray-600 hover:text-brand-600 font-medium transition-colors">エリアから探す</a>
            <a href="#" class="text-gray-600 hover:text-brand-600 font-medium transition-colors">船長紹介</a>
            <a href="#" class="text-gray-600 hover:text-brand-600 font-medium transition-colors">釣果情報</a>
          </nav>

          <div class="hidden md:flex items-center gap-4" id="auth-buttons-desktop">
            <a href="login.html" class="text-brand-600 font-medium hover:text-brand-700 transition-colors">ログイン</a>
            <a href="signup.html" class="btn btn-primary text-sm px-5 py-2">
              無料登録
            </a>
          </div>

          <button class="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" id="mobile-menu-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div class="md:hidden hidden bg-white border-t border-gray-100 absolute w-full" id="mobile-menu">
          <div class="container mx-auto px-4 py-4 flex flex-col gap-4" id="mobile-menu-items">
            <a href="index.html" class="block py-2 text-gray-600 font-medium">ホーム</a>
            <a href="area.html" class="block py-2 text-gray-600 font-medium">エリアから探す</a>
            <a href="#" class="block py-2 text-gray-600 font-medium">船長紹介</a>
            <hr class="border-gray-100">
            <div id="auth-buttons-mobile" class="flex flex-col gap-2">
              <a href="login.html" class="block py-2 text-brand-600 font-medium">ログイン</a>
              <a href="signup.html" class="btn btn-primary w-full text-center">無料登録</a>
            </div>
          </div>
        </div>
      </header>
      <div class="h-16"></div> `;

    // Mobile Menu Logic
    const btn = this.querySelector('#mobile-menu-btn');
    const menu = this.querySelector('#mobile-menu');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
        menu.classList.toggle('animate-fade-in');
      });
    }
  }

  setupAuthListener() {
    monitorAuthState((user) => {
      const desktopAuth = this.querySelector('#auth-buttons-desktop');
      const mobileAuth = this.querySelector('#auth-buttons-mobile');

      if (user) {
        // ログイン状態
        const userName = user.displayName || 'ユーザー';
        
        const loggedInHtmlDesktop = `
          <span class="text-sm text-gray-700 mr-2">ようこそ、${userName}さん</span>
          <button id="logout-btn-desktop" class="text-gray-500 hover:text-brand-600 font-medium transition-colors text-sm">ログアウト</button>
          <a href="admin.html" class="btn btn-primary text-sm px-4 py-2">管理者画面</a>
        `;
        
        const loggedInHtmlMobile = `
          <p class="py-2 text-gray-700 font-bold">ようこそ、${userName}さん</p>
          <a href="admin.html" class="btn btn-primary w-full text-center">管理者画面へ</a>
          <button id="logout-btn-mobile" class="block py-2 text-red-500 font-medium w-full text-left">ログアウト</button>
        `;

        if (desktopAuth) {
            desktopAuth.innerHTML = loggedInHtmlDesktop;
            this.querySelector('#logout-btn-desktop')?.addEventListener('click', logoutUser);
        }
        if (mobileAuth) {
            mobileAuth.innerHTML = loggedInHtmlMobile;
            this.querySelector('#logout-btn-mobile')?.addEventListener('click', logoutUser);
        }

      } else {
        // 未ログイン状態（初期状態に戻す）
        const loggedOutHtmlDesktop = `
          <a href="login.html" class="text-brand-600 font-medium hover:text-brand-700 transition-colors">ログイン</a>
          <a href="signup.html" class="btn btn-primary text-sm px-5 py-2">無料登録</a>
        `;
        
        const loggedOutHtmlMobile = `
          <a href="login.html" class="block py-2 text-brand-600 font-medium">ログイン</a>
          <a href="signup.html" class="btn btn-primary w-full text-center">無料登録</a>
        `;

        if (desktopAuth) desktopAuth.innerHTML = loggedOutHtmlDesktop;
        if (mobileAuth) mobileAuth.innerHTML = loggedOutHtmlMobile;
      }
    });
  }
}

customElements.define('site-header', SiteHeader);