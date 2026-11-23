/**
 * AI 스마트워크 2026학년도 2학기 포트폴리오 공통 네비게이션 및 푸터 스크립트
 * 작성자: 20213528 이종건 (생명과학과 · 경영학과 복수전공)
 */
(function () {
    // 1. 단일 메뉴 및 드롭다운 그룹 정의
    const NAV_CONFIG = {
        singles: [
            { id: 'home', href: 'index.html', label: '소개', subtitle: 'Home / Profile' },
            { id: 'notes', href: 'notes.html', label: '강의 아카이브', subtitle: '강의 필기 & 실습 노트' }
        ],
        groups: [
            {
                id: 'ai-practice',
                label: 'AI 실습',
                badge: '3종',
                childIds: ['reports', 'video', 'agent'],
                items: [
                    { id: 'reports', href: 'reports.html', label: '문서 자동화', desc: '환각 방지 프롬프트 · PPTX/HWPX 자동 생성', icon: '📄' },
                    { id: 'video', href: 'video.html', label: 'AI 영상·모션', desc: 'Google Flow 영상 · 30초 SVG 모션 인포그래픽', icon: '🎬' },
                    { id: 'agent', href: 'agent.html', label: '인터랙티브 AI', desc: 'Google GEMS · Grill-me 역질문 에이전트', icon: '🤖' }
                ]
            },
            {
                id: 'final-project',
                label: '최종 프로젝트',
                badge: '기말 Capstone',
                highlight: true,
                childIds: ['data', 'p4-ebook'],
                items: [
                    { id: 'data', href: 'data.html', label: '수요·재고 분석', desc: '쿠팡 PBL 04 머신러닝 & Newsvendor 발주 최적화', icon: '📊' },
                    { id: 'p4-ebook', href: 'p4-analysis/index.html', label: '웹 분석보고서', desc: 'P4 인터랙티브 Web Ebook & 정밀 백테스트', icon: '📖' }
                ]
            },
            {
                id: 'ebook-studio',
                label: '전자책 스튜디오',
                badge: 'eBook',
                childIds: ['ebook-read', 'ebook-tool'],
                items: [
                    { id: 'ebook-read', href: 'ebook/index.html', label: '전자책 읽기', desc: '한국 메모리 반도체 3D 플립북 전자책', icon: '📘' },
                    { id: 'ebook-tool', href: 'ebook/studio.html', label: '전자책 변환기', desc: 'PDF 문서 브라우저 3D 플립북 변환기', icon: '⚙️' }
                ]
            }
        ]
    };

    function renderNavigation() {
        const navContainer = document.getElementById('site-nav');
        if (!navContainer) return;
        const activeId = document.body.dataset.page || 'home';

        // 1) 데스크톱 단일 메뉴 생성
        const singlesHtml = NAV_CONFIG.singles.map(item => {
            const isActive = item.id === activeId;
            return `
                <a href="${item.href}" class="whitespace-nowrap px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                    isActive 
                        ? 'bg-slate-900 text-white font-bold shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }" title="${item.subtitle}">
                    ${item.label}
                </a>
            `;
        }).join('');

        // 2) 데스크톱 드롭다운 그룹 생성
        const groupsHtml = NAV_CONFIG.groups.map(group => {
            const hasActiveChild = group.childIds.includes(activeId);
            const isHighlight = group.highlight;

            const itemsList = group.items.map(child => {
                const isChildActive = child.id === activeId;
                return `
                    <a href="${child.href}" class="flex items-start gap-2.5 rounded-xl p-2.5 transition-colors ${
                        isChildActive 
                            ? 'bg-sky-50 text-sky-950 font-bold' 
                            : 'hover:bg-slate-50 text-slate-800'
                    }">
                        <span class="mt-0.5 text-base shrink-0">${child.icon}</span>
                        <div>
                            <div class="text-xs font-bold ${isChildActive ? 'text-sky-700' : 'text-slate-900'}">${child.label}</div>
                            <div class="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">${child.desc}</div>
                        </div>
                    </a>
                `;
            }).join('');

            return `
                <div class="relative group" data-dropdown="${group.id}">
                    <button type="button" aria-haspopup="true" aria-expanded="false" class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all ${
                        hasActiveChild
                            ? 'bg-slate-900 text-white font-bold shadow-sm'
                            : isHighlight
                            ? 'bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100 font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }">
                        <span>${group.label}</span>
                        <svg class="h-3 w-3 transition-transform duration-200 group-hover:rotate-180 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    <!-- Dropdown Menu -->
                    <div class="dropdown-menu absolute right-0 mt-1.5 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                        <div class="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                            ${group.label} · ${group.badge}
                        </div>
                        ${itemsList}
                    </div>
                </div>
            `;
        }).join('');

        // 3) 모바일 햄버거 메뉴 리스트
        const mobileSinglesHtml = NAV_CONFIG.singles.map(item => {
            const isActive = item.id === activeId;
            return `
                <a href="${item.href}" class="flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-slate-900 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                }">
                    <span>${item.label}</span>
                    <span class="text-xs opacity-60">→</span>
                </a>
            `;
        }).join('');

        const mobileGroupsHtml = NAV_CONFIG.groups.map(group => {
            const items = group.items.map(child => {
                const isChildActive = child.id === activeId;
                return `
                    <a href="${child.href}" class="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                        isChildActive ? 'bg-sky-100 text-sky-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }">
                        <span class="flex items-center gap-2"><span>${child.icon}</span> ${child.label}</span>
                        <span class="text-[11px] text-slate-400">열기 →</span>
                    </a>
                `;
            }).join('');

            return `
                <div class="pt-2.5 mt-2.5 border-t border-slate-100">
                    <div class="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">${group.label}</div>
                    <div class="space-y-1 mt-1">
                        ${items}
                    </div>
                </div>
            `;
        }).join('');

        navContainer.innerHTML = `
            <nav class="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
                <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
                    <!-- Brand -->
                    <a href="index.html" class="flex shrink-0 items-center gap-2.5 group">
                        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-extrabold tracking-tight text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
                            BIO·AI
                        </span>
                        <div class="leading-tight">
                            <div class="flex items-center gap-1.5">
                                <span class="text-sm font-extrabold text-slate-900 tracking-tight">AI SMARTWORK</span>
                                <span class="text-[10px] font-extrabold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">2026 FALL</span>
                            </div>
                            <span class="block text-[11px] font-medium text-slate-500">생명과학 · 경영학 | 20213528 이종건</span>
                        </div>
                    </a>

                    <!-- Desktop Menu -->
                    <div class="hidden items-center gap-1.5 lg:flex">
                        ${singlesHtml}
                        ${groupsHtml}
                    </div>

                    <!-- Right Tag & Mobile Button -->
                    <div class="flex items-center gap-2">
                        <span class="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 xl:inline-flex">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            황현석 교수님
                        </span>
                        <button id="mobile-menu-btn" type="button" aria-label="메뉴 열기" class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 lg:hidden focus:outline-none focus:ring-2 focus:ring-sky-500">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Mobile Menu Container -->
                <div id="mobile-menu" class="hidden border-t border-slate-100 bg-white px-4 py-3 lg:hidden shadow-lg">
                    <div class="space-y-1">
                        ${mobileSinglesHtml}
                        ${mobileGroupsHtml}
                    </div>
                </div>
            </nav>
        `;

        // Mobile Menu Toggle
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        if (btn && menu) {
            btn.addEventListener('click', () => {
                menu.classList.toggle('hidden');
            });
        }

        // Accessibility: Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (menu && !menu.classList.contains('hidden')) {
                    menu.classList.add('hidden');
                }
            }
        });
    }

    function renderFooter() {
        const footerContainer = document.getElementById('site-footer');
        if (!footerContainer) return;
        const activeId = document.body.dataset.page || 'home';

        // 선형 단계 이동 (과제 순서)
        const LINEAR_STEPS = [
            { id: 'home', href: 'index.html', label: '소개', step: '01' },
            { id: 'notes', href: 'notes.html', label: '강의 아카이브', step: '02' },
            { id: 'reports', href: 'reports.html', label: '문서 자동화', step: '03' },
            { id: 'video', href: 'video.html', label: 'AI 영상·모션', step: '04' },
            { id: 'agent', href: 'agent.html', label: '인터랙티브 AI', step: '05' },
            { id: 'data', href: 'data.html', label: '수요·재고 분석', step: '06', capstone: true }
        ];

        const idx = LINEAR_STEPS.findIndex(item => item.id === activeId);
        const prevItem = idx > 0 ? LINEAR_STEPS[idx - 1] : null;
        const nextItem = idx >= 0 && idx < LINEAR_STEPS.length - 1 ? LINEAR_STEPS[idx + 1] : null;

        const stepNav = `
            <div class="border-b border-slate-100 bg-slate-50/70">
                <div class="mx-auto flex max-w-6xl flex-col items-stretch justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
                    ${
                        prevItem
                            ? `<a href="${prevItem.href}" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900">
                                <span>← 이전: ${prevItem.step}. ${prevItem.label}</span>
                               </a>`
                            : `<span class="text-xs font-medium text-slate-400">STEP 01 · 포트폴리오 첫 페이지</span>`
                    }
                    ${
                        nextItem
                            ? `<a href="${nextItem.href}" class="inline-flex items-center gap-2 rounded-xl ${
                                  nextItem.capstone
                                      ? 'bg-sky-600 text-white hover:bg-sky-500'
                                      : 'bg-slate-900 text-white hover:bg-slate-800'
                              } px-4 py-2 text-xs font-bold shadow-sm transition">
                                <span>다음: ${nextItem.step}. ${nextItem.label} →</span>
                               </a>`
                            : `<a href="index.html" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-100">
                                <span>처음으로: 01. 소개 ↺</span>
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
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">AI SMARTWORK · 2026 FALL</span>
                                <p class="text-sm font-bold text-slate-900">
                                    한림대학교 · 황현석 교수님 'AI 스마트워크' 최종 포트폴리오
                                </p>
                            </div>
                            <p class="mt-1 text-xs text-slate-500">
                                주전공: 생명과학 (Dept. of Life Science) · 복수전공: 경영학과 (Business Administration) · 20213528 이종건
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-2 text-xs font-medium">
                            <a href="index.html" class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700">소개</a>
                            <a href="notes.html" class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700">강의 아카이브</a>
                            <a href="reports.html" class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700">문서 자동화</a>
                            <a href="video.html" class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700">AI 영상·모션</a>
                            <a href="agent.html" class="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700">인터랙티브 AI</a>
                            <a href="data.html" class="px-2.5 py-1 rounded-md border border-sky-300 bg-sky-50 font-bold text-sky-900 hover:bg-sky-100">수요·재고 분석</a>
                            <a href="p4-analysis/index.html" class="px-2.5 py-1 rounded-md border border-sky-300 bg-sky-50 font-bold text-sky-900 hover:bg-sky-100">P4 Web Ebook</a>
                            <a href="CONTENT_SOURCES.md" target="_blank" class="px-2.5 py-1 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold hover:bg-emerald-100">근거 자료 명세</a>
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
