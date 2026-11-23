# 쿠팡 PBL 문제 4(P4) 신선식품 수요 예측 및 재고 발주 최적화 시스템

본 디렉토리(`p4-analysis/`)는 한림대학교 AI 스마트워크 쿠팡 PBL 4번 과제의 머신러닝 수요 예측, Newsvendor 재고 발주 최적화, 정책 시뮬레이션, 자동 보고서 생성 파이프라인 및 인터랙티브 Web Ebook 소스를 포함합니다.

---

## 1. 디렉토리 구조 및 산출물 안내

```text
p4-analysis/
├── P4_fresh_inventory_daily.csv        # 6개월 30개 SKU 일별 원본 가상 데이터 (10,860건)
├── analysis.py                         # 전체 데이터 분석, 모델링, 시각화 자동화 파이프라인
├── requirements.txt                    # 파이썬 의존성 패키지 목록
├── result.md                           # analysis.py 실행 시 자동 생성되는 10개 섹션 핵심 결과서
├── result.txt                          # result.md의 텍스트 버전
├── report.md                           # 11개 섹션의 경영진용 심층 분석 보고서
├── AI_REVIEW_LOG.md                    # 독립 품질 검토 및 감사 로그 (8대 평가 기준)
├── index.html                          # P4 인터랙티브 독립 Web Ebook 메인 페이지
├── README.md                           # 실행 가이드 및 프로젝트 기술 문서 (본 문서)
└── outputs/
    ├── category_summary.csv            # 카테고리별 폐기/품절/손실 집계표
    ├── model_comparison.csv            # 다중 ML 모델 성능 평가표 (MAPE, MAE, RMSE, Bias)
    ├── policy_comparison.csv           # 5대 발주 정책 시뮬레이션 손익 비교표
    ├── sku_recommendations.csv         # 30개 SKU별 권장 발주량 및 임계비율
    └── figures/                        # 한글 폰트 적용 고화질(300 DPI) 분석 차트 7종
        ├── 1_category_waste_stockout_rates.png
        ├── 2_category_loss_amounts.png
        ├── 3_event_forecast_error.png
        ├── 4_model_metric_comparison.png
        ├── 5_actual_vs_predicted_demand.png
        ├── 6_policy_profit_comparison.png
        └── 7_policy_improvement_effect.png
```

---

## 2. 실행 방법 (Windows PowerShell / Command Prompt)

### 2.1 의존성 설치
```powershell
py -m pip install -r requirements.txt
```

### 2.2 파이프라인 실행
```powershell
py analysis.py
```
*실행 시 콘솔에 진행 단계(EDA $\rightarrow$ 피처 엔지니어링 $\rightarrow$ 모델 학습 $\rightarrow$ Newsvendor 산출 $\rightarrow$ 백테스트 $\rightarrow$ 시각화 $\rightarrow$ result.md 생성)가 실시간 출력되며, `outputs/` 및 결과 파일이 자동 갱신됩니다.*

---

## 3. 핵심 방법론 및 평가 지표

### 3.1 시간순 3분할 (무누수 원칙)
- **Train (학습)**: 2026-01-01 ~ 2026-04-30 (7,200건)
- **Validation (검증)**: 2026-05-01 ~ 2026-05-31 (1,860건) — 모델 튜닝 및 SKU별 잔차 불확실성($\sigma$) 추정
- **Test (최종 평가)**: 2026-06-01 ~ 2026-06-30 (1,800건) — 미지 데이터 백테스트

### 3.2 머신러닝 모델 비교
1. **기존 시스템 (Baseline)**: 현업 기존 통계 예측치 (`system_forecast`)
2. **RandomForestRegressor**: 앙상블 배깅 모델 (`n_estimators=120, max_depth=14`)
3. **HistGradientBoostingRegressor (최적 선정)**: 앙상블 부스팅 모델 (`max_iter=250, learning_rate=0.07, l2_reg=2.0`)
4. **SARIMAX**: 대표 시계열(FC_이천 SKU001) 계절 시계열 분석 및 전사 확장 한계 규명

### 3.3 Newsvendor 최적 발주량 산식
- **Critical Ratio**: $CR = \frac{\text{Margin}}{\text{Unit Price}} = \frac{P - C}{P}$
- **Optimal Order**: $Q^* = \max\left(0, \text{round}\left(\hat{y}_{ML} + \Phi^{-1}(CR) \cdot \sigma\right)\right)$

---

## 4. 핵심 분석 결과 요약 (2026년 6월 백테스트)

- **수요예측 RMSE**: 기존 53.42개 $\rightarrow$ HistGradientBoosting **35.80개 (-32.9% 오차 감축)**
- **복합 이벤트 편향**: 기존 -193.73개 $\rightarrow$ HistGradientBoosting **-4.50개 (정상화)**
- **폐기 손실 절감**: 기존 실제 발주 2억 1,838만 원 $\rightarrow$ HGB+Newsvendor **1억 243만 원 (-53.09% 절감)**
- **월 순이익 개선**: 기존 8억 4,609만 원 $\rightarrow$ HGB+Newsvendor **9억 6,417만 원 (+1억 1,808만 원, +13.96% 개선)**
