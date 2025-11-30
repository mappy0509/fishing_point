class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="bg-gray-900 text-gray-300 py-12 mt-auto">
        <div class="container mx-auto px-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <!-- Brand -->
            <div class="col-span-1 md:col-span-1">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span class="text-xl font-bold text-white">FishingMap</span>
              </div>
              <p class="text-sm text-gray-400 leading-relaxed">
                日本全国の釣りポイントを網羅した<br>究極の釣りマップアプリケーション。
              </p>
            </div>

            <!-- Links -->
            <div>
              <h3 class="text-white font-bold mb-4">サービス</h3>
              <ul class="space-y-2 text-sm">
                <li><a href="overview-map.html" class="hover:text-brand-400 transition-colors">マップ検索</a></li>
                <li><a href="area.html" class="hover:text-brand-400 transition-colors">エリア一覧</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">釣果情報</a></li>
                <li><a href="payment.html" class="hover:text-brand-400 transition-colors">料金プラン</a></li>
              </ul>
            </div>

            <div>
              <h3 class="text-white font-bold mb-4">サポート</h3>
              <ul class="space-y-2 text-sm">
                <li><a href="#" class="hover:text-brand-400 transition-colors">よくある質問</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">お問い合わせ</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">利用規約</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">プライバシーポリシー</a></li>
              </ul>
            </div>

            <!-- Newsletter -->
            <div>
              <h3 class="text-white font-bold mb-4">最新情報を受け取る</h3>
              <form class="flex flex-col gap-2">
                <input type="email" placeholder="メールアドレス" class="bg-gray-800 border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:ring-brand-500 focus:border-brand-500">
                <button type="button" class="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-700 transition-colors">
                  登録する
                </button>
              </form>
            </div>
          </div>
          
          <div class="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            &copy; ${new Date().getFullYear()} Japan Agent Co., Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define('site-footer', SiteFooter);