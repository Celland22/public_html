(function () {
    const NAV_ITEMS = [
        { id: 'home', href: 'index.html', label: 'Home / Profile', short: 'Home' },
        { id: 'reports', href: 'reports.html', label: '보고서 자동화', short: '보고서' },
        { id: 'data', href: 'data.html', label: '쿠팡 수요예측', short: '데이터' },
        { id: 'video', href: 'video.html', label: 'AI 영상 제작', short: '영상' },
        { id: 'agent', href: 'agent.html', label: '인터랙티브 봇', short: 'AI 봇' },
        { id: 'notes', href: 'notes.html', label: '강의 필기 노트', short: '필기노트' }
    ];

    function renderNavigation() {
        const navContainer = document.getElementById('site-nav');
        if (!navContainer) return;
        const activeId = document.body.dataset.page || 'home';

        const desktopLinks = NAV_ITEMS.map((item) => {
            const isActive = item.id === activeId;
            return `<a href="${item.href}" class="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }">${item.label}</a>`;
        }).join('');

        const mobileLinks = NAV_ITEMS.map((item) => {
            const isActive = item.id === activeId;
            return `<a href="${item.href}" class="block rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
            }">${item.label}</a>`;
        }).join('');

        navContainer.innerHTML = `
            <nav class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
                <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <a href="index.html" class="flex shrink-0 items-center gap-2.5">
                        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-extrabold tracking-tight text-emerald-400 shadow-sm">
                            BIO·AI
                        </span>
                        <div class="leading-tight">
                            <span class="block text-sm font-extrabold text-slate-900">AI 스마트워크 포트폴리오</span>
                            <span class="block text-[11px] font-medium text-slate-500">생명과학 × 경영학 · 20213528 이종건</span>
                        </div>
                    </a>

                    <div class="hidden items-center gap-1 lg:flex">
                        ${desktopLinks}
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 sm:inline-flex">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            황현석 교수님
                        </span>
                        <button id="mobile-menu-btn" type="button" aria-label="메뉴 열기" class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 lg:hidden">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div id="mobile-menu" class="hidden border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
                    <div class="space-y-1">
                        ${mobileLinks}
                    </div>
                </div>
            </nav>
        `;

        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        if (btn && menu) {
            btn.addEventListener('click', () => {
                menu.classList.toggle('hidden');
            });
        }
    }

    function renderFooter() {
        const footerContainer = document.getElementById('site-footer');
        if (!footerContainer) return;

        footerContainer.innerHTML = `
            <footer class="mt-16 border-t border-slate-200 bg-white">
                <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                    <div class="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div>
                            <p class="text-sm font-bold text-slate-900">
                                한림대학교 · 황현석 교수님 'AI 스마트워크' 기말 최종 포트폴리오
                            </p>
                            <p class="mt-1 text-xs text-slate-500">
                                주전공: 생명과학 (Department of Life Science) · 복수전공: 경영학과 (Double Major in Business Administration) · 20213528 이종건
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-2 text-xs font-medium">
                            ${NAV_ITEMS.map(
                                (item) => `<a href="${item.href}" class="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900">${item.short}</a>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }

    function initLightbox() {
        const triggers = document.querySelectorAll('[data-lightbox-src]');
        if (!triggers.length) return;

        const modal = document.createElement('div');
        modal.id = 'image-lightbox';
        modal.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="relative max-h-[92vh] max-w-5xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/15">
                <div class="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
                    <span id="lightbox-caption" class="text-sm font-semibold"></span>
                    <button id="lightbox-close" type="button" class="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20">닫기 ✕</button>
                </div>
                <div class="flex max-h-[82vh] items-center justify-center bg-black p-2">
                    <img id="lightbox-img" src="" alt="" class="max-h-[78vh] w-auto rounded-lg object-contain">
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const imgEl = document.getElementById('lightbox-img');
        const capEl = document.getElementById('lightbox-caption');
        const closeBtn = document.getElementById('lightbox-close');

        function closeModal() {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            imgEl.src = '';
        }

        triggers.forEach((el) => {
            el.addEventListener('click', () => {
                imgEl.src = el.getAttribute('data-lightbox-src');
                capEl.textContent = el.getAttribute('data-lightbox-caption') || '';
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            });
        });

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderNavigation();
        renderFooter();
        initLightbox();
    });
})();
