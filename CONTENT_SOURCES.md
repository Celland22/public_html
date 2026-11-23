# AI 스마트워크 2026학년도 2학기 포트폴리오 실제 근거 자료 명세서 (CONTENT_SOURCES.md)

**작성자**: 한림대학교 생명과학과 · 경영학과 복수전공 20213528 이종건  
**과목**: AI 스마트워크 (황현석 교수님)  
**원칙**: 본 포트폴리오 사이트([https://aismartwork20213528.netlify.app/](https://aismartwork20213528.netlify.app/))의 모든 페이지와 콘텐츠는 2026학년도 2학기 수업 중 실제 수행한 실습, 제출한 과제물, 업로드된 원본 파일만을 근거로 구성되었습니다. 허구의 프로젝트나 검증되지 않은 외부 성과는 일체 포함하지 않습니다.

---

## 1. 페이지별 실제 근거 자료 및 파일 매핑

| 웹페이지 | 메뉴 명칭 | 주요 다루는 내용 | 저장소 내 실제 물리 파일 및 근거 폴더 |
|:---|:---|:---|:---|
| `index.html` | **소개** (Home / Profile) | 학업 프로필(생명과학/경영학), 수업 학습 로드맵, 자격증·이수증(42건), 수업 활동 요약 | • `주차별 강의요약_확장버전.pdf`<br>• `중간과제/` (중간고사 과제 제출물 묶음)<br>• 실제 취득 자격증 및 이수증 내역 |
| `notes.html` | **강의 아카이브** | 1~15주차 강의 필기, 실습 명령어, 도구별 프롬프트 패턴, 디버깅 경험 아카이브 | • `Notebook LM AI_스마트_워크.pdf`<br>• `주차별 강의요약_확장버전.pdf`<br>• `Prompt작성가이드.pdf`<br>• `GenAI를 활용한 데이터 분석.pdf` |
| `reports.html` | **AI 실습 > 문서 자동화** | 환각 방지 프롬프트 설계, Claude 커스텀 스킬을 통한 XML 기반 PPTX·HWPX 자동화 | • `hwpx skill과 참고 파일/`<br>• `hallym-edu-pptx/` & `hallym-edu-pptx.zip`<br>• `my_pptx_skill.zip`<br>• `한국의+SDG+이행보고서+2025+이행보고서(국문).pdf`<br>• `신선식품_재고발주_분석보고서.hwpx` |
| `video.html` | **AI 실습 > AI 영상·모션** | 시간차 렌더링 통제 영상 제작, HTML5 Canvas/SVG + Web Audio 기반 30초 인터랙티브 모션 인포그래픽 | • `Google Flow 영상 만들기/`<br>• `Claude Motion/P4_로켓프레시_30초_Motion_Effect.html`<br>• `Claude Motion/P4_로켓프레시_Motion_Effect_30초_최종제작계획.md`<br>• `중간과제/20213528_중간고사_영상.mp4`<br>• `중간과제/20213528_중간고사_영상_생성형 AI.txt` |
| `agent.html` | **AI 실습 > 인터랙티브 AI** | Google GEMS 커스텀 지침, Grill-me 역질문 기법 기반 PDF 카드뉴스 매직 에디터 에이전트 | • `GEMS 쿠팡/`<br>• `Mini assignment/`<br>• `ChatGPT 이미지 생성/`<br>• `코드 AI/` |
| `data.html` | **최종 프로젝트 > 수요·재고 분석** | 쿠팡 PBL 문제 4 신선식품 수요예측·Newsvendor 발주 최적화, 30초 모션 임베드, Claude 엑셀 이중축 콤보차트 | • `p4-analysis/P4_fresh_inventory_daily.csv`<br>• `Claude 엑셀/기업실적_콤보차트.xlsx`<br>• `7주차 개별 활동/analysis.py`<br>• `7주차 개별 활동/5_advanced_simulation_comparison.csv` |
| `p4-analysis/index.html` | **최종 프로젝트 > 웹 분석보고서** | 쿠팡 PBL 문제 4 고도화 머신러닝(HistGradientBoosting) 수요예측 및 Newsvendor 최적화 인터랙티브 Web Ebook | • `p4-analysis/analysis.py`<br>• `p4-analysis/outputs/category_summary.csv`<br>• `p4-analysis/outputs/model_comparison.csv`<br>• `p4-analysis/outputs/policy_comparison.csv`<br>• `p4-analysis/outputs/sku_recommendations.csv`<br>• `p4-analysis/outputs/figures/*.png` (7종 그래프) |
| `ebook/index.html` | **전자책 스튜디오 > 전자책 읽기** | 한국 메모리 반도체 산업 분석 보고서 3D 플립북 인터랙티브 전자책 | • `ebook/` 내부 HTML/CSS/JS 에셋 및 반도체 보고서 페이지 데이터 |
| `ebook/studio.html` | **전자책 스튜디오 > 전자책 변환기** | PDF 문서를 업로드하여 브라우저 내에서 3D 플립북 전자책으로 자동 변환하는 웹 도구 | • `ebook/studio.html`<br>• PDF.js 및 Turn.js 기반 변환 엔진 |

---

## 2. P4 쿠팡 신선식품 분석 데이터 및 수치 출처

- **원본 데이터 파일**: `p4-analysis/P4_fresh_inventory_daily.csv` (10,860행, 결측치 0)
- **분석 실행 코드**: `p4-analysis/analysis.py` (파이썬 3.15, scikit-learn, scipy, statsmodels, matplotlib)
- **자동 산출 보고서**:
  - `p4-analysis/result.md` (자동 생성된 정량 요약)
  - `p4-analysis/report.md` (경영진용 분석보고서)
  - `p4-analysis/AI_REVIEW_LOG.md` (독립적 파이썬 스크립트 기반 수치 감사 로그)
- **과거 분석 참조 파일**: `7주차 개별 활동/5_advanced_simulation_comparison.csv` (과거 1차 분석 수치 보존 및 비교 소명 근거)

---

## 3. 교수님 과제 필수 구성요소 점검 증빙

1. **인터넷 주소가 있는 웹사이트**: Netlify 호스팅 배포 ([https://aismartwork20213528.netlify.app/](https://aismartwork20213528.netlify.app/))
2. **데이터 기반 분석보고서**: `data.html`, `p4-analysis/index.html`, `p4-analysis/report.md`
3. **영상 또는 Motion Effect 1종**: 
   - `Claude Motion/P4_로켓프레시_30초_Motion_Effect.html` (30초 SVG 모션 인포그래픽, Live iframe 임베드)
   - `중간과제/20213528_중간고사_영상.mp4` (실제 제작 비디오)
4. **문제와 해결책을 보여주는 구성**:
   - 문제: 신선식품 시간 압박, 과잉 발주(폐기) vs 과소 발주(품절) 상충, 기존 +12% 버퍼의 역효과
   - 해결책: HistGradientBoosting ML 수요예측 + Newsvendor 임계비율 기반 동적 안전재고 최적화
5. **이미지 1종 이상 포함**: `p4-analysis/outputs/figures/` 내 고화질 분석 차트 7종 생성 및 웹북 임베드
6. **E-book 형식의 보고서**: 
   - `p4-analysis/index.html` (P4 신선식품 최적화 Web Ebook)
   - `ebook/index.html` (한국 메모리 반도체 3D 플립북 Ebook)
7. **배경음악 및 오디오**:
   - `Claude Motion/P4_로켓프레시_30초_Motion_Effect.html` 내 Web Audio API 기반 오디오 신디사이저 엔진 (저작권 침해 없는 순수 브라우저 합성 사운드)
   - `중간과제/20213528_중간고사_영상.mp4` 내장 오디오 트랙

---
*본 명세서는 2026학년도 2학기 AI 스마트워크 최종 평가를 위해 모든 산출물의 출처와 사실관계를 보증합니다.*
