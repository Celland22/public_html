(function () {
    const NAV_ITEMS = [
        { id: 'home', step: '01', href: 'index.html', label: 'Home / Profile', short: '1. Home' },
        { id: 'notes', step: '02', href: 'notes.html', label: '강의 필기 노트', short: '2. 강의필기' },
        { id: 'reports', step: '03', href: 'reports.html', label: '보고서 자동화', short: '3. 보고서' },
        { id: 'video', step: '04', href: 'video.html', label: 'AI 영상 제작', short: '4. AI 영상' },
        { id: 'agent', step: '05', href: 'agent.html', label: '인터랙티브 봇', short: '5. AI 봇' },
        { id: 'data', step: '06', href: 'data.html', label: '쿠팡 분석 · 기말과제', short: '6. 쿠팡(기말)', capstone: true }
    ];

    function renderNavigation() {
        const navContainer = document.getElementById('site-nav');
        if (!navContainer) return;
        const activeId = document.body.dataset.page || 'home';

        const desktopLinks = NAV_ITEMS.map((item) => {
            const isActive = item.id === activeId;
            if (isActive) {
                return `<a href="${item.href}" class="whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[13px] font-bold text-white shadow-sm">${item.label}</a>`;
            }
            if (item.capstone) {
                return `<a href="${item.href}" class="whitespace-nowrap rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[13px] font-bold text-sky-800 transition-all hover:bg-sky-100">${item.label}</a>`;
            }
            return `<a href="${item.href}" class="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900">${item.label}</a>`;
        }).join('');

        const mobileLinks = NAV_ITEMS.map((item) => {
            const isActive = item.id === activeId;
            return `<a href="${item.href}" class="flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                    ? 'bg-slate-900 text-white'
                    : item.capstone
                    ? 'bg-sky-50 text-sky-900 hover:bg-sky-100'
                    : 'text-slate-700 hover:bg-slate-100'
            }"><span>${item.step}. ${item.label}</span><span class="text-xs opacity-60">→</span></a>`;
        }).join('');

        navContainer.innerHTML = `
            <nav class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
                <div class="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
                    <a href="index.html" class="flex shrink-0 items-center gap-2.5">
                        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-extrabold tracking-tight text-emerald-400 shadow-sm">
                            BIO·AI
                        </span>
                        <div class="leading-tight">
                            <span class="block text-sm font-extrabold text-slate-900">AI 스마트워크</span>
                            <span class="block text-[11px] font-medium text-slate-500">생명과학 · 경영학 | 20213528 이종건</span>
                        </div>
                    </a>

                    <div class="hidden items-center gap-1 lg:flex">
                        ${desktopLinks}
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 xl:inline-flex">
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
        const activeId = document.body.dataset.page || 'home';
        const idx = NAV_ITEMS.findIndex((item) => item.id === activeId);
        const prevItem = idx > 0 ? NAV_ITEMS[idx - 1] : null;
        const nextItem = idx >= 0 && idx < NAV_ITEMS.length - 1 ? NAV_ITEMS[idx + 1] : null;

        const stepNav = `
            <div class="border-b border-slate-100 bg-slate-50/70">
                <div class="mx-auto flex max-w-6xl flex-col items-stretch justify-between gap-3 px-4 py-5 sm:flex-row sm:items-center sm:px-6 lg:px-8">
                    ${
                        prevItem
                            ? `<a href="${prevItem.href}" class="inline-flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                                <span>← 이전: ${prevItem.step}. ${prevItem.label}</span>
                               </a>`
                            : `<span class="text-xs font-medium text-slate-400">STEP 01 · 포트폴리오 시작 페이지</span>`
                    }
                    ${
                        nextItem
                            ? `<a href="${nextItem.href}" class="inline-flex items-center justify-between gap-3 rounded-xl ${
                                  nextItem.capstone
                                      ? 'bg-sky-600 text-white hover:bg-sky-500'
                                      : 'bg-slate-900 text-white hover:bg-slate-800'
                              } px-4 py-2.5 text-xs font-bold shadow-sm transition">
                                <span>다음: ${nextItem.step}. ${nextItem.label} →</span>
                               </a>`
                            : `<a href="index.html" class="inline-flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100">
                                <span>처음으로: 01. Home / Profile ↺</span>
                               </a>`
                    }
                </div>
            </div>
        `;

        footerContainer.innerHTML = `
            <footer class="mt-16 border-t border-slate-200 bg-white">
                ${stepNav}
                <div class="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8">
                    <div class="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div>
                            <p class="text-sm font-bold text-slate-900">
                                한림대학교 · 황현석 교수님 'AI 스마트워크' 기말 최종 포트폴리오
                            </p>
                            <p class="mt-1 text-xs text-slate-500">
                                주전공: 생명과학 (Department of Life Science) · 복수전공: 경영학과 (Double Major in Business Administration) · 20213528 이종건
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-1.5 text-xs font-medium">
                            ${NAV_ITEMS.map(
                                (item) => `<a href="${item.href}" class="rounded-md border px-2.5 py-1 transition-colors ${
                                    item.id === activeId
                                        ? 'border-slate-900 bg-slate-900 font-bold text-white'
                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                                }">${item.short}</a>`
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
