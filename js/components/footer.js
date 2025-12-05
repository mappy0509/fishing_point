class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="bg-gray-900 text-white pt-16 pb-8 border-t border-gray-800">
        <div class="container mx-auto px-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            <div class="col-span-1 md:col-span-1">
              <a href="index.html" class="flex items-center gap-2 mb-6 group">
                <div class="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-brand-200">
                  磯リンク
                </span>
              </a>
              <p class="text-gray-400 text-sm leading-relaxed mb-6">
                九州全域の磯釣りポイントを360度ビューで完全網羅。
                釣り人による、釣り人のための究極のフィールドガイド。
              </p>
              <div class="flex gap-4">
                <a href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-600 transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clip-rule="evenodd" /></svg>
                </a>
                <a href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-brand-600 transition-colors">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 014.061 2.465c.636-.247 1.363-.416 2.427-.465C7.502 1.96 7.86 1.94 10.28 1.94m0-1.94c-2.7 0-3.04.01-4.1.06-1.06.05-1.79.23-2.43.47a6.908 6.908 0 00-2.51 1.63 6.908 6.908 0 00-1.63 2.51c-.24.64-.42 1.37-.47 2.43-.05 1.06-.06 1.4-.06 4.1s.01 3.04.06 4.1c.05 1.06.23 1.79.47 2.43a6.908 6.908 0 001.63 2.51c.64.64 1.37.91 2.51 1.15 1.06.05 1.4.06 4.1.06 2.7 0 3.04-.01 4.1-.06 1.06-.05 1.79-.23 2.43-.47a6.908 6.908 0 002.51-1.63 6.908 6.908 0 001.63-2.51c.24-.64.42-1.37.47-2.43.05-1.06.06-1.4.06-4.1s-.01-3.04-.06-4.1c-.05-1.06-.23-1.79-.47-2.43a6.908 6.908 0 00-1.63-2.51 6.908 6.908 0 00-2.51-1.63c-.64-.24-1.37-.42-2.43-.47-1.06-.05-1.4-.06-4.1-.06z" fill-rule="evenodd" /></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 class="text-white font-bold mb-4">サービス</h4>
              <ul class="space-y-2 text-sm text-gray-400">
                <li><a href="index.html" class="hover:text-brand-400 transition-colors">ホーム</a></li>
                <li><a href="area.html" class="hover:text-brand-400 transition-colors">エリア一覧</a></li>
                <li><a href="overview-map.html" class="hover:text-brand-400 transition-colors">マップ検索</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">船長・渡船紹介</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">最新釣果</a></li>
              </ul>
            </div>

            <div>
              <h4 class="text-white font-bold mb-4">サポート</h4>
              <ul class="space-y-2 text-sm text-gray-400">
                <li><a href="#" class="hover:text-brand-400 transition-colors">ご利用ガイド</a></li>
                <li><a href="payment.html" class="hover:text-brand-400 transition-colors">プレミアム会員</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">よくある質問</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">お問い合わせ</a></li>
                <li><a href="admin.html" class="hover:text-brand-400 transition-colors">管理者ログイン</a></li>
              </ul>
            </div>

            <div>
              <h4 class="text-white font-bold mb-4">運営情報</h4>
              <ul class="space-y-2 text-sm text-gray-400">
                <li><a href="#" class="hover:text-brand-400 transition-colors">運営会社</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">利用規約</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">プライバシーポリシー</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">特定商取引法に基づく表記</a></li>
              </ul>
            </div>

          </div>

          <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-gray-500 text-sm">
              &copy; 2025 Iso Link. All rights reserved.
            </p>
            <p class="text-gray-600 text-xs">
              Made with <span class="text-red-500">♥</span> in Kyushu
            </p>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define('site-footer', SiteFooter);