class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="bg-gray-900 text-white pt-12 md:pt-16 pb-24 md:pb-8 border-t border-gray-800">
        <div class="container mx-auto px-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            
            <div class="col-span-2 md:col-span-1">
              <a href="index.html" class="flex items-center gap-2 mb-4 md:mb-6 group">
                <div class="w-8 h-8 md:w-10 md:h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span class="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-brand-200">
                  磯リンク
                </span>
              </a>
              <p class="text-gray-400 text-xs md:text-sm leading-relaxed mb-6">
                釣り人による、釣り人のための究極のフィールドガイド。<br>
                九州の磯を手のひらに。
              </p>
            </div>

            <div class="col-span-1">
              <h4 class="text-white font-bold mb-3 md:mb-4 text-sm md:text-base">探す・知る</h4>
              <ul class="space-y-2 text-xs md:text-sm text-gray-400">
                <li><a href="area.html" class="hover:text-brand-400 transition-colors">エリアから探す</a></li>
                <li><a href="overview-map.html" class="hover:text-brand-400 transition-colors">マップ検索</a></li>
                <li><a href="captain.html" class="hover:text-brand-400 transition-colors">船長紹介</a></li>
                <li><a href="reviews.html" class="hover:text-brand-400 transition-colors">みんなの釣果</a></li>
              </ul>
            </div>

            <div class="col-span-1">
              <h4 class="text-white font-bold mb-3 md:mb-4 text-sm md:text-base">サポート</h4>
              <ul class="space-y-2 text-xs md:text-sm text-gray-400">
                <li><a href="payment.html" class="hover:text-brand-400 transition-colors">プレミアム会員</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">よくある質問</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">お問い合わせ</a></li>
                <li><a href="admin.html" class="hover:text-brand-400 transition-colors">管理者ログイン</a></li>
              </ul>
            </div>

            <div class="col-span-2 md:col-span-1 border-t border-gray-800 pt-6 md:border-none md:pt-0">
              <h4 class="text-white font-bold mb-3 md:mb-4 text-sm md:text-base">運営情報</h4>
              <ul class="space-y-2 text-xs md:text-sm text-gray-400 flex flex-row flex-wrap gap-x-4 gap-y-2 md:flex-col md:gap-0">
                <li><a href="terms.html" class="hover:text-brand-400 transition-colors">利用規約</a></li>
                <li><a href="privacy.html" class="hover:text-brand-400 transition-colors">プライバシーポリシー</a></li>
                <li><a href="#" class="hover:text-brand-400 transition-colors">特定商取引法</a></li>
              </ul>
            </div>

          </div>

          <div class="border-t border-gray-800 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-gray-500 text-xs md:text-sm">
              &copy; 2025 Iso Link.
            </p>
            <p class="text-gray-600 text-[10px] md:text-xs">
              Made in Kyushu
            </p>
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define('site-footer', SiteFooter);