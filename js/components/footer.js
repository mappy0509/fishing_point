class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="bg-gray-900 text-white py-8 pb-24 md:pb-8 border-t border-gray-800">
        <div class="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <a href="index.html" class="flex items-center gap-2 group opacity-80 hover:opacity-100 transition-opacity">
            <div class="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span class="text-lg font-bold text-gray-200">
              磯リンク
            </span>
          </a>

          <div class="text-center md:text-right">
            <div class="flex items-center justify-center md:justify-end gap-4 mb-2 text-xs text-gray-500">
               <a href="terms.html" class="hover:text-gray-300">利用規約</a>
               <a href="privacy.html" class="hover:text-gray-300">プライバシーポリシー</a>
               <a href="admin.html" class="hover:text-gray-300">管理者</a>
            </div>
            <p class="text-gray-600 text-[10px]">
              &copy; 2025 Iso Link. All rights reserved.
            </p>
          </div>

        </div>
      </footer>
    `;
  }
}

customElements.define('site-footer', SiteFooter);