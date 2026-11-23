/**
 * AI 스마트워크 2026학년도 2학기 포트폴리오 공통 네비게이션, 푸터 및 전역 BGM 관리 스크립트
 * 작성자: 20213528 이종건 (생명과학과 주전공 · 경영학과 복수전공)
 * 지도교수: 황현석 교수님 (한림대학교 경영대학)
 * 디자인 시스템: Clean Academic Portfolio
 */
(function () {
    'use strict';

    // 1. 개편된 권장 메뉴 구조 정의
    const NAV_CONFIG = {
        singlesLeft: [
            { id: 'home', href: 'index.html', label: '홈', subtitle: '소개 & 핵심 결과물' }
        ],
        groups: [
            {
                id: 'final-project',
                label: '기말 프로젝트',
                badge: 'PBL 04',
                highlight: true,
                childIds: ['p4-overview', 'data', 'p4-ebook', 'p4-motion', 'p4-downloads'],
                items: [
                    { id: 'p4-overview', href: 'data.html#p4-overview', label: '프로젝트 개요', desc: '신선식품 시간 제약과 비대칭 비용 딜레마', icon: '🎯' },
                    { id: 'data', href: 'data.html#analysis', label: '수요·재고 분석', desc: '쿠팡 PBL 04 머신러닝 & Newsvendor 발주 최적화', icon: '📊' },
                    { id: 'p4-ebook', href: 'p4-analysis/index.html', label: 'P4 E-book 보고서', desc: '8개 챕터 디지털 모노그래프 & PDF 인쇄 지원', icon: '📖' },
                    { id: 'p4-motion', href: 'video.html#motion-showcase', label: '30초 Motion Effect', desc: '잔잔한 오리지널 BGM 연동 HTML5 모션 플레이어', icon: '🎬' },
                    { id: 'p4-downloads', href: 'data.html#deliverables', label: '원본 데이터·코드 다운로드', desc: 'CSV 원본, analysis.py, 독립 감사 로그 전수 공개', icon: '💾' }
                ]
            },
            {
                id: 'ai-practice',
                label: 'AI 실습 아카이브',
                badge: '4종 실습',
                childIds: ['reports', 'video', 'agent', 'ebook-studio'],
                items: [
                    { id: 'reports', href: 'reports.html', label: '문서·보고서 및 발표자료 자동화', desc: '환각 방지 프롬프트 · Claude XML PPTX/HWPX 스킬', icon: '📄' },
                    { id: 'video', href: 'video.html', label: 'AI 이미지·영상·모션 제작', desc: '키프레임 연속성 통제 · 상업용 광고 영상 렌더링', icon: '🎥' },
                    { id: 'agent', href: 'agent.html', label: '인터랙티브 AI 및 에이전트', desc: 'Google GEMS · Grill-me 역질문 카드뉴스 에디터', icon: '🤖' },
                    { id: 'ebook-studio', href: 'ebook/index.html', label: '전자책 제작 실습 (3D Flipbook)', desc: '한국 메모리 반도체 플립북 및 PDF-to-eBook 스튜디오', icon: '📘' }
                ]
            }
        ],
        singlesRight: [
            { id: 'notes', href: 'notes.html', label: '강의 기록', subtitle: '주차별 필기 & 공식 강의자료' }
        ]
    };

    // 전역 오디오 객체
    let globalAudio = null;
    let isBgmPlaying = false;
    let pausedByVideo = false;

    function initAudio() {
        if (!globalAudio) {
            globalAudio = new Audio();
            // 경로 안전망: 절대 경로 우선 및 상대 경로 백업
            const baseAudioPath = window.location.pathname.includes('/p4-analysis/') || window.location.pathname.includes('/ebook/')
                ? '../assets/audio/p4_ambient_bgm.wav'
                : 'assets/audio/p4_ambient_bgm.wav';
            globalAudio.src = baseAudioPath;
            globalAudio.loop = true;
            globalAudio.volume = 0.30; // 조용한 배경음악 음량
            globalAudio.preload = 'none';
        }
    }

    function updateBgmButtons(playing) {
        isBgmPlaying = playing;
        const btns = document.querySelectorAll('.global-bgm-toggle-btn');
        btns.forEach(btn => {
            btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
            if (playing) {
                btn.className = 'global-bgm-toggle-btn inline-flex items-center gap-1.5 rounded-full border border-blue-600 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-xs hover:bg-blue-100 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-600';
                btn.innerHTML = `
                    <span class="inline-block h-2 w-2 rounded-full bg-blue-600 animate-pulse" aria-hidden="true"></span>
                    <span aria-hidden="true">🔊</span>
                    <span>음악 ON</span>
                `;
            } else {
                btn.className = 'global-bgm-toggle-btn inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-900';
                btn.innerHTML = `
                    <span aria-hidden="true">🔇</span>
                    <span>음악 OFF</span>
                `;
            }
        });
    }

    async function toggleGlobalBgm() {
        initAudio();
        if (isBgmPlaying) {
            globalAudio.pause();
            updateBgmButtons(false);
            localStorage.setItem('site_bgm_user_choice', 'off');
        } else {
            try {
                await globalAudio.play();
                updateBgmButtons(true);
                localStorage.setItem('site_bgm_user_choice', 'on');
            } catch (err) {
                console.warn('사용자 클릭 이전 자동재생 차단 또는 오디오 로딩 지연:', err);
                updateBgmButtons(false);
            }
        }
    }

    function setupMediaSync() {
        // 1) iframe postMessage 수신 (P4 Motion Effect 등)
        window.addEventListener('message', (event) => {
            if (!event.data || typeof event.data !== 'object') return;
            if (event.data.action === 'media_play') {
                if (globalAudio && !globalAudio.paused) {
                    globalAudio.pause();
                    pausedByVideo = true;
                    updateBgmButtons(false);
                }
            } else if (event.data.action === 'media_stop' || event.data.action === 'media_pause') {
                if (pausedByVideo && localStorage.getItem('site_bgm_user_choice') === 'on') {
                    if (globalAudio) {
                        globalAudio.play().then(() => {
                            updateBgmButtons(true);
                            pausedByVideo = false;
                        }).catch(() => {});
                    }
                }
            }
        });

        // 2) 페이지 내 HTML5 <video> 태그 재생 감지
        document.querySelectorAll('video').forEach((v) => {
            v.addEventListener('play', () => {
                if (globalAudio && !globalAudio.paused) {
                    globalAudio.pause();
                    pausedByVideo = true;
                    updateBgmButtons(false);
                }
            });
            v.addEventListener('pause', () => {
                const anyPlaying = Array.from(document.querySelectorAll('video')).some(x => !x.paused);
                if (!anyPlaying && pausedByVideo && localStorage.getItem('site_bgm_user_choice') === 'on') {
                    if (globalAudio) {
                        globalAudio.play().then(() => {
                            updateBgmButtons(true);
                            pausedByVideo = false;
                        }).catch(() => {});
                    }
                }
            });
            v.addEventListener('ended', () => {
                if (pausedByVideo && localStorage.getItem('site_bgm_user_choice') === 'on') {
                    if (globalAudio) {
                        globalAudio.play().then(() => {
                            updateBgmButtons(true);
                            pausedByVideo = false;
                        }).catch(() => {});
                    }
                }
            });
        });
    }

    function renderNavigation() {
        const navContainer = document.getElementById('site-nav');
        if (!navContainer) return;

        const activeId = document.body.dataset.page || 'home';

        // 1) 좌측 단일 메뉴 (홈)
        const leftSinglesHtml = NAV_CONFIG.singlesLeft.map(item => {
            const isActive = item.id === activeId;
            return `
                <a href="${item.href}" class="rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    isActive ? 'bg-slate-900 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }">
                    ${item.label}
                </a>
            `;
        }).join('');

        // 2) 드롭다운 메뉴 그룹 (기말 프로젝트 & AI 실습 아카이브)
        const groupsHtml = NAV_CONFIG.groups.map(group => {
            const hasActiveChild = group.childIds.includes(activeId);
            const isHighlight = group.highlight;

            const itemsList = group.items.map(child => {
                const isChildActive = child.id === activeId;
                return `
                    <a href="${child.href}" class="flex items-start gap-2.5 rounded-xl p-2.5 transition-colors ${
                        isChildActive ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }">
                        <span class="mt-0.5 text-base shrink-0" aria-hidden="true">${child.icon}</span>
                        <div>
                            <div class="text-xs font-semibold ${isChildActive ? 'text-blue-700' : 'text-slate-900'}">${child.label}</div>
                            <div class="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">${child.desc}</div>
                        </div>
                    </a>
                `;
            }).join('');

            return `
                <div class="relative group" data-dropdown="${group.id}">
                    <button type="button" aria-haspopup="true" aria-expanded="false" class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                        hasActiveChild
                            ? 'bg-slate-900 text-white font-semibold shadow-xs'
                            : isHighlight
                            ? 'bg-blue-50 text-blue-900 border border-blue-200/80 hover:bg-blue-100/70 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }">
                        <span>${group.label}</span>
                        <svg class="h-3 w-3 transition-transform duration-200 group-hover:rotate-180 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true" focusable="false">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    <!-- Dropdown Menu -->
                    <div class="dropdown-menu absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-slate-950/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                        <div class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                            ${group.label} · ${group.badge}
                        </div>
                        <div class="space-y-0.5">
                            ${itemsList}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 3) 우측 단일 메뉴 (강의 기록)
        const rightSinglesHtml = NAV_CONFIG.singlesRight.map(item => {
            const isActive = item.id === activeId;
            return `
                <a href="${item.href}" class="rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    isActive ? 'bg-slate-900 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }">
                    ${item.label}
                </a>
            `;
        }).join('');

        // 4) 모바일 햄버거 메뉴 리스트
        const mobileGroupsHtml = NAV_CONFIG.groups.map(group => {
            const items = group.items.map(child => {
                const isChildActive = child.id === activeId;
                return `
                    <a href="${child.href}" class="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium ${
                        isChildActive ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }">
                        <span class="flex items-center gap-2"><span aria-hidden="true">${child.icon}</span> ${child.label}</span>
                        <span class="text-[11px] text-slate-400">열기 →</span>
                    </a>
                `;
            }).join('');

            return `
                <div class="pt-2.5 mt-2.5 border-t border-slate-100">
                    <div class="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">${group.label} · ${group.badge}</div>
                    <div class="space-y-1 mt-1">
                        ${items}
                    </div>
                </div>
            `;
        }).join('');

        navContainer.innerHTML = `
            <nav class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
                <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
                    <!-- Brand -->
                    <a href="index.html" class="flex shrink-0 items-center gap-2.5 group">
                        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-bold tracking-tight text-white shadow-xs group-hover:bg-blue-600 transition-colors">
                            AI
                        </span>
                        <div class="leading-tight">
                            <div class="flex items-center gap-1.5">
                                <span class="text-sm font-bold text-slate-900 tracking-tight">AI SMARTWORK</span>
                                <span class="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/80">2026-2</span>
                            </div>
                            <span class="block text-[11px] font-normal text-slate-500">생명과학 · 경영학 | 20213528 이종건</span>
                        </div>
                    </a>

                    <!-- Desktop Menu -->
                    <div class="hidden items-center gap-1.5 lg:flex">
                        ${leftSinglesHtml}
                        ${groupsHtml}
                        ${rightSinglesHtml}
                    </div>

                    <!-- Right Area: Global Music Button & Mobile Hamburger -->
                    <div class="flex items-center gap-2">
                        <!-- 전역 배경음악 토글 버튼 (PC & 모바일 공통) -->
                        <button type="button" class="global-bgm-toggle-btn inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-900" aria-label="배경음악 토글" aria-pressed="false" title="배경음악 켜기/끄기">
                            <span aria-hidden="true">🔇</span>
                            <span>음악 OFF</span>
                        </button>

                        <button id="mobile-menu-btn" type="button" aria-label="모바일 메뉴 열기" class="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Mobile Menu Container -->
                <div id="mobile-menu" class="hidden border-t border-slate-100 bg-white px-4 py-3 lg:hidden shadow-lg">
                    <div class="space-y-1">
                        <a href="index.html" class="flex items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium ${
                            activeId === 'home' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                        }">
                            <span>홈 (포트폴리오 소개)</span>
                            <span class="text-xs opacity-50">→</span>
                        </a>
                        ${mobileGroupsHtml}
                        <div class="pt-2 mt-2 border-t border-slate-100">
                            <a href="notes.html" class="flex items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium ${
                                activeId === 'notes' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                            }">
                                <span>강의 기록 (주차별 필기 &amp; 공식 자료)</span>
                                <span class="text-xs opacity-50">→</span>
                            </a>
                        </div>
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

        // BGM Toggle Event Listeners
        document.querySelectorAll('.global-bgm-toggle-btn').forEach(b => {
            b.addEventListener('click', toggleGlobalBgm);
        });

        // 자동 복원 시도 (사용자가 이전에 ON으로 설정해둔 경우)
        if (localStorage.getItem('site_bgm_user_choice') === 'on') {
            initAudio();
            globalAudio.play().then(() => {
                updateBgmButtons(true);
            }).catch(() => {
                // 브라우저 정책으로 차단된 경우 가짜 ON 대신 OFF 표시를 유지하여 사용자가 직접 클릭하도록 유도
                updateBgmButtons(false);
            });
        }

        setupMediaSync();
    }

    function renderFooter() {
        const footerContainer = document.getElementById('site-footer');
        if (!footerContainer) return;

        footerContainer.innerHTML = `
            <footer class="border-t border-slate-200/80 bg-white py-12 text-xs text-slate-600">
                <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div class="grid grid-cols-1 gap-8 md:grid-cols-12">
                        <div class="md:col-span-5 space-y-3">
                            <div class="flex items-center gap-2">
                                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">AI</span>
                                <span class="font-bold text-slate-900 text-sm">AI 스마트워크 학기 최종 포트폴리오</span>
                            </div>
                            <p class="text-slate-500 leading-relaxed text-xs">
                                한림대학교 2026학년도 2학기 AI 스마트워크 과목의 한 학기 전체 연구 및 실습 결과물을 집대성한 포트폴리오입니다.
                                모든 결과물은 실제 저장소 내 물리 파일 및 파이썬 분석 파이프라인을 근거로 작성되었습니다.
                            </p>
                            <p class="font-mono text-[11px] text-slate-400">
                                지도교수: 황현석 교수님 · 경영대학 | 작성자: 20213528 이종건
                            </p>
                        </div>
                        <div class="md:col-span-3 space-y-2">
                            <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">주요 산출물 바로가기</h4>
                            <ul class="space-y-1.5 text-slate-500">
                                <li><a href="data.html" class="hover:text-blue-600 transition">기말 프로젝트 (쿠팡 PBL 04)</a></li>
                                <li><a href="p4-analysis/index.html" class="hover:text-blue-600 transition">P4 디지털 연구 E-Book</a></li>
                                <li><a href="video.html" class="hover:text-blue-600 transition">30초 인터랙티브 Motion Effect</a></li>
                                <li><a href="reports.html" class="hover:text-blue-600 transition">문서·발표자료 자동화</a></li>
                                <li><a href="notes.html" class="hover:text-blue-600 transition">주차별 강의 기록</a></li>
                            </ul>
                        </div>
                        <div class="md:col-span-4 space-y-2">
                            <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">학술 정합성 및 오픈 데이터</h4>
                            <p class="text-[11px] text-slate-500 leading-relaxed">
                                P4 실습 데이터는 학업용 가상 시나리오 데이터셋(10,860건)이며, 모든 수치는 <code class="font-mono text-blue-700">analysis.py</code> 및 <code class="font-mono text-blue-700">AI_REVIEW_LOG.md</code>를 통해 100% 재현 가능합니다.
                            </p>
                            <div class="pt-2 flex flex-wrap gap-2 text-[11px]">
                                <a href="CONTENT_SOURCES.md" target="_blank" class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 hover:bg-slate-100">근거 자료 명세서 (MD) ↗</a>
                                <a href="CV_Jonggeon_Lee.docx" download class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700 hover:bg-slate-100">이종건 CV ↓</a>
                            </div>
                        </div>
                    </div>
                    <div class="mt-8 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                        <span>© 2026 Jonggeon Lee. All rights reserved.</span>
                        <span>Designed with Clean Academic Editorial System</span>
                    </div>
                </div>
            </footer>
        `;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            renderNavigation();
            renderFooter();
        });
    } else {
        renderNavigation();
        renderFooter();
    }
})();
