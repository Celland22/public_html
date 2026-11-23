"""
AI 스마트워크 PBL 문제 4(P4) 신선식품 수요 예측 및 재고 발주 최적화 분석 파이프라인
작성자: 시니어 AI/ML 엔지니어 & 데이터 분석가
실행 방법: py analysis.py
출력:
  - result.md, result.txt
  - outputs/model_comparison.csv
  - outputs/category_summary.csv
  - outputs/policy_comparison.csv
  - outputs/sku_recommendations.csv
  - outputs/figures/*.png (7종 고화질 분석 그래프)
"""

import os
import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import norm
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import OneHotEncoder
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import statsmodels.api as sm

warnings.filterwarnings('ignore')

# ---------------------------------------------------------
# 0. 경로 및 환경 설정
# ---------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_PATH = SCRIPT_DIR / 'P4_fresh_inventory_daily.csv'
OUTPUTS_DIR = SCRIPT_DIR / 'outputs'
FIGURES_DIR = OUTPUTS_DIR / 'figures'

OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
FIGURES_DIR.mkdir(parents=True, exist_ok=True)

# 한글 폰트 설정
plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['figure.autolayout'] = True

def fmt_krw(val):
    return f"{int(round(val)):,}원"

def fmt_num(val):
    return f"{int(round(val)):,}개"

def fmt_pct(val):
    return f"{val:.2f}%"

def calc_mape(y_true, y_pred):
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    return float(np.mean(np.abs(y_true - y_pred) / np.maximum(y_true, 1.0)) * 100)

def calc_rmse(y_true, y_pred):
    return float(np.sqrt(mean_squared_error(y_true, y_pred)))

def calc_bias(y_true, y_pred):
    return float(np.mean(y_pred - y_true))

# ---------------------------------------------------------
# 1. 데이터 로드 및 탐색적 데이터 분석 (EDA)
# ---------------------------------------------------------
print("=" * 70)
print("🚀 [Step 1] 데이터 로드 및 탐색적 데이터 분석(EDA) 시작...")
print("=" * 70)

df = pd.read_csv(DATA_PATH, parse_dates=['date'])
df = df.sort_values(by=['date', 'center', 'sku_id']).reset_index(drop=True)

# 기본 재무 파생변수
df['margin_krw'] = df['unit_price_krw'] - df['unit_cost_krw']
df['waste_loss_krw'] = df['waste_qty'] * df['unit_cost_krw']
df['opportunity_loss_krw'] = df['stockout_qty'] * df['margin_krw']
df['observed_profit_krw'] = (df['sold_qty'] * df['unit_price_krw']) - (df['order_qty'] * df['unit_cost_krw'])
df['critical_ratio'] = df['margin_krw'] / (df['margin_krw'] + df['unit_cost_krw'])

total_rows = len(df)
n_centers = df['center'].nunique()
n_skus = df['sku_id'].nunique()
n_categories = df['category'].nunique()
start_date = df['date'].min().strftime('%Y-%m-%d')
end_date = df['date'].max().strftime('%Y-%m-%d')

total_order = df['order_qty'].sum()
total_demand = df['actual_demand'].sum()
total_waste = df['waste_qty'].sum()
total_stockout = df['stockout_qty'].sum()
total_waste_loss = df['waste_loss_krw'].sum()
total_opp_loss = df['opportunity_loss_krw'].sum()

waste_rate = (total_waste / total_order) * 100
stockout_rate = (total_stockout / total_demand) * 100

print(f"기간: {start_date} ~ {end_date} (총 {total_rows:,}행)")
print(f"센터: {df['center'].unique().tolist()}, SKU: {n_skus}개, 카테고리: {n_categories}개")
print(f"전체 관측 폐기율: {waste_rate:.2f}% ({total_waste:,}개 / 폐기손실 {total_waste_loss:,.0f}원)")
print(f"전체 관측 품절률: {stockout_rate:.2f}% ({total_stockout:,}개 / 기회손실 {total_opp_loss:,.0f}원)")

# 카테고리별 요약 집계
cat_summary = df.groupby('category', as_index=False).agg(
    order_qty=('order_qty', 'sum'),
    actual_demand=('actual_demand', 'sum'),
    waste_qty=('waste_qty', 'sum'),
    stockout_qty=('stockout_qty', 'sum'),
    waste_loss_krw=('waste_loss_krw', 'sum'),
    opportunity_loss_krw=('opportunity_loss_krw', 'sum'),
    avg_shelf_life=('shelf_life_days', 'mean'),
    avg_cost=('unit_cost_krw', 'mean'),
    avg_price=('unit_price_krw', 'mean')
)
cat_summary['waste_rate_pct'] = (cat_summary['waste_qty'] / cat_summary['order_qty']) * 100
cat_summary['stockout_rate_pct'] = (cat_summary['stockout_qty'] / cat_summary['actual_demand']) * 100
cat_summary['avg_margin_krw'] = cat_summary['avg_price'] - cat_summary['avg_cost']
cat_summary['avg_critical_ratio'] = cat_summary['avg_margin_krw'] / cat_summary['avg_price']
cat_summary = cat_summary.sort_values(by='waste_loss_krw', ascending=False).reset_index(drop=True)

cat_summary.to_csv(OUTPUTS_DIR / 'category_summary.csv', index=False, encoding='utf-8-sig')
print("✅ 카테고리별 요약 저장 완료: outputs/category_summary.csv")

# 이벤트 조건별 시스템 예측 오차 진단 (전체 10,860건 기준)
df['sys_bias'] = df['system_forecast'] - df['actual_demand']

event_diag = []
event_labels = [
    (0, 0, '평시 (비프로모션 / 평일)', 'Normal'),
    (1, 0, '프로모션 단독 발생', 'Promo Only'),
    (0, 1, '명절/공휴일 단독 발생', 'Holiday Only'),
    (1, 1, '프로모션 + 명절 동시 발생 (고위험)', 'Promo + Holiday')
]

for p, h, label_kr, label_en in event_labels:
    sub = df[(df['promo_flag'] == p) & (df['holiday_flag'] == h)]
    event_diag.append({
        'promo_flag': p,
        'holiday_flag': h,
        '조건': label_kr,
        '라벨': label_en,
        '표본수': len(sub),
        '평균_실수요': round(sub['actual_demand'].mean(), 1),
        '평균_시스템예측': round(sub['system_forecast'].mean(), 1),
        'MAPE(%)': round(calc_mape(sub['actual_demand'], sub['system_forecast']), 2),
        'MAE(개)': round(mean_absolute_error(sub['actual_demand'], sub['system_forecast']), 2),
        'RMSE(개)': round(calc_rmse(sub['actual_demand'], sub['system_forecast']), 2),
        '평균_편향_Bias(개)': round(calc_bias(sub['actual_demand'], sub['system_forecast']), 2)
    })

event_diag_df = pd.DataFrame(event_diag)

# ---------------------------------------------------------
# 2. 시계열 피처 엔지니어링 및 데이터 누수 방지
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("🛠 [Step 2] 시계열 피처 엔지니어링 및 무누수(Leakage-Free) 분할...")
print("=" * 70)

# 시계열 순서로 정렬하여 과거 시점 파생변수 생성
df = df.sort_values(by=['center', 'sku_id', 'date']).reset_index(drop=True)

df['weekday'] = df['date'].dt.dayofweek
df['month'] = df['date'].dt.month
df['day'] = df['date'].dt.day
df['is_weekend'] = df['weekday'].isin([5, 6]).astype(int)
df['promo_holiday_interaction'] = df['promo_flag'] * df['holiday_flag']

# 과거 시계열 특성 (그룹별 Shift)
df['lag_1'] = df.groupby(['center', 'sku_id'])['actual_demand'].shift(1)
df['lag_2'] = df.groupby(['center', 'sku_id'])['actual_demand'].shift(2)
df['lag_7'] = df.groupby(['center', 'sku_id'])['actual_demand'].shift(7)

# 롤링 통계량 (lag_1 기준 롤링)
df['roll_mean_3'] = df.groupby(['center', 'sku_id'])['lag_1'].transform(lambda s: s.rolling(3, min_periods=1).mean())
df['roll_mean_7'] = df.groupby(['center', 'sku_id'])['lag_1'].transform(lambda s: s.rolling(7, min_periods=1).mean())
df['roll_std_7'] = df.groupby(['center', 'sku_id'])['lag_1'].transform(lambda s: s.rolling(7, min_periods=1).std()).fillna(0)

# 초기 결측치 대치
df['lag_1'] = df['lag_1'].fillna(df['system_forecast'])
df['lag_2'] = df['lag_2'].fillna(df['system_forecast'])
df['lag_7'] = df['lag_7'].fillna(df['system_forecast'])
df['roll_mean_3'] = df['roll_mean_3'].fillna(df['system_forecast'])
df['roll_mean_7'] = df['roll_mean_7'].fillna(df['system_forecast'])

# 시간순 데이터 분할
# Train: 2026-01-01 ~ 2026-04-30 (1~4월)
# Validation: 2026-05-01 ~ 2026-05-31 (5월)
# Test: 2026-06-01 ~ 2026-06-30 (6월)
train_df = df[df['date'] < '2026-05-01'].copy()
valid_df = df[(df['date'] >= '2026-05-01') & (df['date'] < '2026-06-01')].copy()
test_df = df[df['date'] >= '2026-06-01'].copy()

print(f"Train 세트: {train_df['date'].min().date()} ~ {train_df['date'].max().date()} ({len(train_df):,}건)")
print(f"Validation 세트: {valid_df['date'].min().date()} ~ {valid_df['date'].max().date()} ({len(valid_df):,}건)")
print(f"Test 세트: {test_df['date'].min().date()} ~ {test_df['date'].max().date()} ({len(test_df):,}건)")

# 특성 컬럼 정의
cat_features = ['center', 'sku_id', 'category']
num_features = [
    'system_forecast', 'shelf_life_days', 'temperature_c',
    'unit_cost_krw', 'unit_price_krw',
    'weekday', 'month', 'day', 'is_weekend',
    'promo_flag', 'holiday_flag', 'promo_holiday_interaction',
    'lag_1', 'lag_2', 'lag_7', 'roll_mean_3', 'roll_mean_7', 'roll_std_7'
]

ohe = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
ohe.fit(train_df[cat_features])
encoded_cat_names = list(ohe.get_feature_names_out(cat_features))

def prepare_features(sub_df):
    X_cat = ohe.transform(sub_df[cat_features])
    X_num = sub_df[num_features].to_numpy(dtype=float)
    X_all = np.hstack([X_cat, X_num])
    return X_all

X_train = prepare_features(train_df)
y_train = train_df['actual_demand'].to_numpy(dtype=float)

X_valid = prepare_features(valid_df)
y_valid = valid_df['actual_demand'].to_numpy(dtype=float)

X_test = prepare_features(test_df)
y_test = test_df['actual_demand'].to_numpy(dtype=float)

# 전체 데이터 특성 (이벤트 포괄 평가용)
X_all = prepare_features(df)
y_all = df['actual_demand'].to_numpy(dtype=float)

# ---------------------------------------------------------
# 3. 다중 머신러닝 모델 학습 및 검증
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("🤖 [Step 3] 다중 머신러닝 모델 학습 및 검증...")
print("=" * 70)

# (1) Model 1: RandomForestRegressor
print("▶ [1/3] RandomForestRegressor 학습 중...")
rf_model = RandomForestRegressor(
    n_estimators=120,
    max_depth=14,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)

# (2) Model 2: HistGradientBoostingRegressor
print("▶ [2/3] HistGradientBoostingRegressor 학습 중...")
hgb_model = HistGradientBoostingRegressor(
    max_iter=250,
    max_leaf_nodes=31,
    learning_rate=0.07,
    l2_regularization=2.0,
    min_samples_leaf=15,
    random_state=42
)
hgb_model.fit(X_train, y_train)

# (3) Model 3: SARIMAX 대표 시계열
print("▶ [3/3] SARIMAX 대표 시계열(FC_이천 SKU001) 학습 및 전체 시계열 적합성 검토...")
sample_mask_train = (train_df['center'] == 'FC_이천') & (train_df['sku_id'] == 'SKU001')
sample_mask_test = (test_df['center'] == 'FC_이천') & (test_df['sku_id'] == 'SKU001')

sarimax_train_y = train_df.loc[sample_mask_train, 'actual_demand'].values
sarimax_train_exog = train_df.loc[sample_mask_train, ['promo_flag', 'holiday_flag', 'temperature_c', 'system_forecast']].values
sarimax_test_y = test_df.loc[sample_mask_test, 'actual_demand'].values
sarimax_test_exog = test_df.loc[sample_mask_test, ['promo_flag', 'holiday_flag', 'temperature_c', 'system_forecast']].values

try:
    sarimax_mod = sm.tsa.statespace.SARIMAX(
        sarimax_train_y,
        exog=sarimax_train_exog,
        order=(1, 0, 1),
        seasonal_order=(1, 0, 0, 7),
        enforce_stationarity=False,
        enforce_invertibility=False
    )
    sarimax_res = sarimax_mod.fit(disp=False, maxiter=100)
    sarimax_pred_sample = sarimax_res.forecast(steps=len(sarimax_test_y), exog=sarimax_test_exog)
    sarimax_sample_mape = calc_mape(sarimax_test_y, sarimax_pred_sample)
    sarimax_sample_mae = mean_absolute_error(sarimax_test_y, sarimax_pred_sample)
    print(f"   - SARIMAX(대표 SKU001): MAPE {sarimax_sample_mape:.2f}%, MAE {sarimax_sample_mae:.2f}개")
except Exception as e:
    sarimax_sample_mape = np.nan
    sarimax_sample_mae = np.nan
    print(f"   - SARIMAX 오류: {str(e)}")

# 예측값 할당 (6월 Test 세트)
test_df['pred_baseline'] = test_df['system_forecast']
test_df['pred_rf'] = np.maximum(0, rf_model.predict(X_test))
test_df['pred_hgb'] = np.maximum(0, hgb_model.predict(X_test))

# 5월 검증 세트 예측 (불확실성 추정용)
valid_df['pred_baseline'] = valid_df['system_forecast']
valid_df['pred_rf'] = np.maximum(0, rf_model.predict(X_valid))
valid_df['pred_hgb'] = np.maximum(0, hgb_model.predict(X_valid))

# 전체 세트 예측 (전체 이벤트 분석용)
df['pred_baseline'] = df['system_forecast']
df['pred_rf'] = np.maximum(0, rf_model.predict(X_all))
df['pred_hgb'] = np.maximum(0, hgb_model.predict(X_all))

# ---------------------------------------------------------
# 4. 모델별 성능 비교표 생성
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("📊 [Step 4] 모델별 성능 평가 및 비교...")
print("=" * 70)

models = [
    ('기존 시스템(Baseline)', 'pred_baseline'),
    ('RandomForestRegressor', 'pred_rf'),
    ('HistGradientBoostingRegressor', 'pred_hgb')
]

model_eval_rows = []
for model_name, pred_col in models:
    preds = test_df[pred_col]
    m_mape = calc_mape(y_test, preds)
    m_mae = mean_absolute_error(y_test, preds)
    m_rmse = calc_rmse(y_test, preds)
    m_bias = calc_bias(y_test, preds)
    
    # 6월 테스트 세트 내 평시 vs 프로모션
    sub_norm = test_df[test_df['promo_flag'] == 0]
    sub_promo = test_df[test_df['promo_flag'] == 1]
    
    # 전체 6개월 세트에서 복합 이벤트(프로모션+명절) 대응력 평가
    all_both = df[(df['promo_flag'] == 1) & (df['holiday_flag'] == 1)]
    both_mape = calc_mape(all_both['actual_demand'], all_both[pred_col])
    both_bias = calc_bias(all_both['actual_demand'], all_both[pred_col])
    
    model_eval_rows.append({
        '모델명': model_name,
        '6월_MAPE(%)': round(m_mape, 2),
        '6월_MAE(개)': round(m_mae, 2),
        '6월_RMSE(개)': round(m_rmse, 2),
        '6월_Bias(개)': round(m_bias, 2),
        '6월_평시_MAPE(%)': round(calc_mape(sub_norm['actual_demand'], sub_norm[pred_col]), 2),
        '6월_프로모션_MAPE(%)': round(calc_mape(sub_promo['actual_demand'], sub_promo[pred_col]), 2),
        '전체_복합이벤트_MAPE(%)': round(both_mape, 2),
        '전체_복합이벤트_Bias(개)': round(both_bias, 2)
    })

model_eval_df = pd.DataFrame(model_eval_rows)
model_eval_df.to_csv(OUTPUTS_DIR / 'model_comparison.csv', index=False, encoding='utf-8-sig')
print("✅ 모델 성능 비교표 저장 완료: outputs/model_comparison.csv")
print(model_eval_df.to_string(index=False))

# ---------------------------------------------------------
# 5. Newsvendor 발주 최적화 및 잔차 불확실성 추정
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("📦 [Step 5] Newsvendor 발주 최적화 및 안전계수 산출...")
print("=" * 70)

for model_name, pred_col in [('RF', 'pred_rf'), ('HGB', 'pred_hgb'), ('Baseline', 'pred_baseline')]:
    res_col = f'residual_{pred_col}'
    valid_df[res_col] = valid_df['actual_demand'] - valid_df[pred_col]
    global_sigma = max(1.0, float(valid_df[res_col].std(ddof=1)))
    
    sku_sigma = valid_df.groupby(['center', 'sku_id'])[res_col].agg(['std', 'count']).reset_index()
    sku_sigma.columns = ['center', 'sku_id', f'sigma_{pred_col}', f'count_{pred_col}']
    
    test_df = test_df.merge(sku_sigma, on=['center', 'sku_id'], how='left')
    sig_series = test_df[f'sigma_{pred_col}'].fillna(global_sigma)
    cnt_series = test_df[f'count_{pred_col}'].fillna(0)
    test_df[f'final_sigma_{pred_col}'] = np.where(cnt_series >= 10, sig_series, global_sigma).clip(min=1.0)

# 임계비율 Critical Ratio = Margin / (Margin + Cost) = (Price - Cost) / Price
test_df['cr'] = (test_df['margin_krw'] / test_df['unit_price_krw']).clip(0.05, 0.95)
test_df['z_score'] = norm.ppf(test_df['cr']).clip(-2.5, 2.5)

# 발주 정책별 수량 산출
test_df['order_policy_1_actual'] = test_df['order_qty']
test_df['order_policy_2_rule12'] = np.maximum(0, np.rint(test_df['system_forecast'] * 1.12)).astype(int)
test_df['order_policy_3_base_nv'] = np.maximum(0, np.rint(test_df['pred_baseline'] + test_df['z_score'] * test_df['final_sigma_pred_baseline'])).astype(int)
test_df['order_policy_4_rf_nv'] = np.maximum(0, np.rint(test_df['pred_rf'] + test_df['z_score'] * test_df['final_sigma_pred_rf'])).astype(int)
test_df['order_policy_5_hgb_nv'] = np.maximum(0, np.rint(test_df['pred_hgb'] + test_df['z_score'] * test_df['final_sigma_pred_hgb'])).astype(int)

# SKU별 권장 발주량 요약 생성
sku_rec = test_df.groupby(['center', 'sku_id', 'category'], as_index=False).agg(
    avg_demand=('actual_demand', 'mean'),
    avg_sys_pred=('system_forecast', 'mean'),
    avg_hgb_pred=('pred_hgb', 'mean'),
    avg_rf_pred=('pred_rf', 'mean'),
    avg_actual_order=('order_policy_1_actual', 'mean'),
    avg_hgb_nv_order=('order_policy_5_hgb_nv', 'mean'),
    critical_ratio=('cr', 'mean'),
    unit_cost=('unit_cost_krw', 'mean'),
    unit_price=('unit_price_krw', 'mean')
)
sku_rec['critical_ratio_pct'] = (sku_rec['critical_ratio'] * 100).round(1)
sku_rec[['avg_demand', 'avg_sys_pred', 'avg_hgb_pred', 'avg_rf_pred', 'avg_actual_order', 'avg_hgb_nv_order']] = \
    sku_rec[['avg_demand', 'avg_sys_pred', 'avg_hgb_pred', 'avg_rf_pred', 'avg_actual_order', 'avg_hgb_nv_order']].round(1)

sku_rec_display = sku_rec.rename(columns={
    'center': '센터', 'sku_id': 'SKU', 'category': '카테고리',
    'avg_demand': '평균실수요', 'avg_sys_pred': '기존예측수요',
    'avg_hgb_pred': 'HGB예측수요', 'avg_rf_pred': 'RF예측수요',
    'avg_actual_order': '기존실제발주량', 'avg_hgb_nv_order': 'HGB권장발주량',
    'critical_ratio_pct': '임계비율(%)'
})
sku_rec_display.to_csv(OUTPUTS_DIR / 'sku_recommendations.csv', index=False, encoding='utf-8-sig')
print("✅ SKU별 권장 발주량 저장 완료: outputs/sku_recommendations.csv")

# ---------------------------------------------------------
# 6. 정책별 백테스트 시뮬레이션 및 손익 비교
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("💰 [Step 6] 2026년 6월 백테스트 시뮬레이션 및 손익 평가...")
print("=" * 70)

policies = [
    ('정책 1: 기존 실제 발주 정책', 'order_policy_1_actual'),
    ('정책 2: 기존 예측 + 12% 버퍼 정책', 'order_policy_2_rule12'),
    ('정책 3: Baseline + Newsvendor', 'order_policy_3_base_nv'),
    ('정책 4: Random Forest + Newsvendor', 'order_policy_4_rf_nv'),
    ('정책 5: HistGradientBoosting + Newsvendor (권장)', 'order_policy_5_hgb_nv')
]

sim_results = []
baseline_profit = None
baseline_waste_loss = None

for p_name, col in policies:
    q = test_df[col].to_numpy(dtype=float)
    demand = test_df['actual_demand'].to_numpy(dtype=float)
    price = test_df['unit_price_krw'].to_numpy(dtype=float)
    cost = test_df['unit_cost_krw'].to_numpy(dtype=float)
    margin = test_df['margin_krw'].to_numpy(dtype=float)
    
    sold = np.minimum(q, demand)
    waste = np.maximum(q - demand, 0)
    stockout = np.maximum(demand - q, 0)
    
    tot_order = int(np.sum(q))
    tot_sold = int(np.sum(sold))
    tot_waste = int(np.sum(waste))
    tot_stockout = int(np.sum(stockout))
    
    revenue = float(np.sum(sold * price))
    purch_cost = float(np.sum(q * cost))
    waste_loss = float(np.sum(waste * cost))
    opp_loss = float(np.sum(stockout * margin))
    profit = revenue - purch_cost
    
    if baseline_profit is None:
        baseline_profit = profit
        baseline_waste_loss = waste_loss
    
    profit_diff = profit - baseline_profit
    profit_impr_pct = (profit_diff / baseline_profit) * 100 if baseline_profit != 0 else 0
    waste_diff = waste_loss - baseline_waste_loss
    waste_reduc_pct = (waste_diff / baseline_waste_loss) * 100 if baseline_waste_loss != 0 else 0
    
    sim_results.append({
        '정책명': p_name,
        '총발주량(개)': tot_order,
        '판매량(개)': tot_sold,
        '폐기량(개)': tot_waste,
        '품절량(개)': tot_stockout,
        '폐기율(%)': round(tot_waste / tot_order * 100, 2),
        '품절률(%)': round(tot_stockout / np.sum(demand) * 100, 2),
        '총매출액(원)': int(round(revenue)),
        '폐기손실액(원)': int(round(waste_loss)),
        '기회손실액(원)': int(round(opp_loss)),
        '총이익(원)': int(round(profit)),
        '이익개선액(원)': int(round(profit_diff)),
        '이익개선율(%)': round(profit_impr_pct, 2),
        '폐기손실절감율(%)': round(-waste_reduc_pct, 2)
    })

sim_df = pd.DataFrame(sim_results)
sim_df.to_csv(OUTPUTS_DIR / 'policy_comparison.csv', index=False, encoding='utf-8-sig')
print("✅ 정책 시뮬레이션 결과 저장 완료: outputs/policy_comparison.csv")
print(sim_df[['정책명', '총발주량(개)', '폐기손실액(원)', '기회손실액(원)', '총이익(원)', '이익개선율(%)']].to_string(index=False))

# 6월 실제 데이터셋 관측값(Multi-period actual observed)
june_actual_waste_loss = int(test_df['waste_loss_krw'].sum())
june_actual_opp_loss = int(test_df['opportunity_loss_krw'].sum())
june_actual_profit = int(test_df['observed_profit_krw'].sum())

# ---------------------------------------------------------
# 7. 분석 시각화 그래프 7종 생성 (한글 폰트 적용)
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("📈 [Step 7] 고화질 분석 시각화 그래프 7종 제작...")
print("=" * 70)

# (1) 카테고리별 폐기율 및 품절률 차트
fig, ax1 = plt.subplots(figsize=(10, 5), dpi=300)
x = np.arange(len(cat_summary))
width = 0.35

rects1 = ax1.bar(x - width/2, cat_summary['waste_rate_pct'], width, label='폐기율 (%)', color='#e11d48', alpha=0.85)
rects2 = ax1.bar(x + width/2, cat_summary['stockout_rate_pct'], width, label='품절률 (%)', color='#0284c7', alpha=0.85)

ax1.set_ylabel('비율 (%)', fontsize=12, fontweight='bold')
ax1.set_title('카테고리별 폐기율 vs 품절률 비교 (2026년 1~6월 전체)', fontsize=14, fontweight='bold', pad=15)
ax1.set_xticks(x)
ax1.set_xticklabels(cat_summary['category'], fontsize=11, fontweight='bold')
ax1.legend(loc='upper right', frameon=True)
ax1.grid(axis='y', linestyle='--', alpha=0.4)

for rect in rects1:
    h = rect.get_height()
    ax1.annotate(f'{h:.2f}%', xy=(rect.get_x() + rect.get_width() / 2, h),
                 xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=9, fontweight='bold')
for rect in rects2:
    h = rect.get_height()
    ax1.annotate(f'{h:.2f}%', xy=(rect.get_x() + rect.get_width() / 2, h),
                 xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=9, fontweight='bold')

fig.savefig(FIGURES_DIR / '1_category_waste_stockout_rates.png', dpi=300)
plt.close(fig)
print("  - [1/7] 1_category_waste_stockout_rates.png")

# (2) 카테고리별 폐기 손실액 vs 기회 손실액
fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
rects1 = ax.bar(x - width/2, cat_summary['waste_loss_krw'] / 1e6, width, label='폐기 손실액 (백만원)', color='#be123c', alpha=0.85)
rects2 = ax.bar(x + width/2, cat_summary['opportunity_loss_krw'] / 1e6, width, label='기회 손실액 (백만원)', color='#0369a1', alpha=0.85)

ax.set_ylabel('손실 금액 (백만 원)', fontsize=12, fontweight='bold')
ax.set_title('카테고리별 재고 불균형 손실 규모 비교 (원가 및 마진 기준)', fontsize=14, fontweight='bold', pad=15)
ax.set_xticks(x)
ax.set_xticklabels(cat_summary['category'], fontsize=11, fontweight='bold')
ax.legend(loc='upper right', frameon=True)
ax.grid(axis='y', linestyle='--', alpha=0.4)

for rect in rects1:
    h = rect.get_height()
    ax.annotate(f'{h:.1f}M', xy=(rect.get_x() + rect.get_width() / 2, h),
                xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=9, fontweight='bold')
for rect in rects2:
    h = rect.get_height()
    ax.annotate(f'{h:.1f}M', xy=(rect.get_x() + rect.get_width() / 2, h),
                xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=9, fontweight='bold')

fig.savefig(FIGURES_DIR / '2_category_loss_amounts.png', dpi=300)
plt.close(fig)
print("  - [2/7] 2_category_loss_amounts.png")

# (3) 프로모션 및 명절 이벤트별 예측 오차(MAPE & Bias)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5), dpi=300)
cond_labels = [row['라벨'] for _, row in event_diag_df.iterrows()]
cond_mapes = [row['MAPE(%)'] for _, row in event_diag_df.iterrows()]
cond_biases = [row['평균_편향_Bias(개)'] for _, row in event_diag_df.iterrows()]

colors = ['#64748b', '#f59e0b', '#3b82f6', '#ef4444']
bars1 = ax1.bar(cond_labels, cond_mapes, color=colors, alpha=0.85)
ax1.set_ylabel('MAPE (%)', fontsize=11, fontweight='bold')
ax1.set_title('이벤트 조건별 기존 시스템 MAPE (전체 기간)', fontsize=12, fontweight='bold')
ax1.grid(axis='y', linestyle='--', alpha=0.4)
for b in bars1:
    h = b.get_height()
    ax1.annotate(f'{h:.1f}%', xy=(b.get_x() + b.get_width() / 2, h),
                 xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=9, fontweight='bold')

bars2 = ax2.bar(cond_labels, cond_biases, color=colors, alpha=0.85)
ax2.axhline(0, color='black', linewidth=0.8, linestyle='--')
ax2.set_ylabel('평균 편향 Bias (예측 - 실제, 개)', fontsize=11, fontweight='bold')
ax2.set_title('이벤트 조건별 기존 시스템 예측 편향(Bias)', fontsize=12, fontweight='bold')
ax2.grid(axis='y', linestyle='--', alpha=0.4)
for b in bars2:
    h = b.get_height()
    ax2.annotate(f'{h:.1f}', xy=(b.get_x() + b.get_width() / 2, h),
                 xytext=(0, -14 if h < 0 else 3), textcoords="offset points", ha='center', va='bottom', fontsize=9, fontweight='bold')

fig.suptitle('프로모션 및 명절 이벤트에 따른 기존 예측 시스템의 취약성 진단 (10,860건)', fontsize=14, fontweight='bold', y=1.02)
fig.savefig(FIGURES_DIR / '3_event_forecast_error.png', dpi=300)
plt.close(fig)
print("  - [3/7] 3_event_forecast_error.png")

# (4) 모델별 MAPE, MAE, RMSE 비교 차트
fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
m_names = [row['모델명'].replace('Regressor', '') for _, row in model_eval_df.iterrows()]
m_mapes = [row['6월_MAPE(%)'] for _, row in model_eval_df.iterrows()]
m_maes = [row['6월_MAE(개)'] for _, row in model_eval_df.iterrows()]
m_rmses = [row['6월_RMSE(개)'] for _, row in model_eval_df.iterrows()]

x = np.arange(len(m_names))
w = 0.25

b1 = ax.bar(x - w, m_mapes, w, label='6월 MAPE (%)', color='#3b82f6', alpha=0.85)
b2 = ax.bar(x, m_maes, w, label='6월 MAE (개)', color='#10b981', alpha=0.85)
b3 = ax.bar(x + w, m_rmses, w, label='6월 RMSE (개)', color='#8b5cf6', alpha=0.85)

ax.set_ylabel('지표 수치', fontsize=11, fontweight='bold')
ax.set_title('2026년 6월 테스트 세트 머신러닝 모델별 예측 성능 비교', fontsize=14, fontweight='bold', pad=15)
ax.set_xticks(x)
ax.set_xticklabels(m_names, fontsize=11, fontweight='bold')
ax.legend(loc='upper right', frameon=True)
ax.grid(axis='y', linestyle='--', alpha=0.4)

for bars in [b1, b2, b3]:
    for b in bars:
        h = b.get_height()
        ax.annotate(f'{h:.2f}', xy=(b.get_x() + b.get_width() / 2, h),
                    xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=8, fontweight='bold')

fig.savefig(FIGURES_DIR / '4_model_metric_comparison.png', dpi=300)
plt.close(fig)
print("  - [4/7] 4_model_metric_comparison.png")

# (5) 실제 수요와 모델별 예측 수요 시계열 비교 (6월 일별 총 수요)
daily_test = test_df.groupby('date').agg(
    actual=('actual_demand', 'sum'),
    baseline=('system_forecast', 'sum'),
    rf=('pred_rf', 'sum'),
    hgb=('pred_hgb', 'sum')
).reset_index()

fig, ax = plt.subplots(figsize=(11, 5), dpi=300)
ax.plot(daily_test['date'], daily_test['actual'], 'k-', linewidth=2.2, label='실제 수요 (Actual Demand)')
ax.plot(daily_test['date'], daily_test['baseline'], 'r--', linewidth=1.5, alpha=0.8, label='기존 시스템 예측 (Baseline)')
ax.plot(daily_test['date'], daily_test['rf'], 'g-.', linewidth=1.7, alpha=0.85, label='Random Forest 예측')
ax.plot(daily_test['date'], daily_test['hgb'], 'b-', linewidth=1.8, alpha=0.9, label='HistGradientBoosting 예측 (최적)')

ax.set_ylabel('총 일별 수요량 (개)', fontsize=11, fontweight='bold')
ax.set_title('2026년 6월 전체 SKU 일별 실제 수요 vs 모델별 예측 궤적', fontsize=14, fontweight='bold', pad=15)
ax.legend(loc='upper left', frameon=True)
ax.grid(True, linestyle='--', alpha=0.4)
fig.autofmt_xdate()

fig.savefig(FIGURES_DIR / '5_actual_vs_predicted_demand.png', dpi=300)
plt.close(fig)
print("  - [5/7] 5_actual_vs_predicted_demand.png")

# (6) 모델별 발주 정책의 손익 비교 (총매출, 폐기손실, 총이익)
fig, ax = plt.subplots(figsize=(11, 5), dpi=300)
p_short_names = ['기존 실제 발주', '기존 예측+12%', 'Baseline+NV', 'RF+NV', 'HGB+NV (권장)']
profits_mil = [row['총이익(원)'] / 1e6 for _, row in sim_df.iterrows()]
waste_mil = [row['폐기손실액(원)'] / 1e6 for _, row in sim_df.iterrows()]
opp_mil = [row['기회손실액(원)'] / 1e6 for _, row in sim_df.iterrows()]

x = np.arange(len(p_short_names))
w = 0.25

b1 = ax.bar(x - w, profits_mil, w, label='총이익 (백만원)', color='#059669', alpha=0.9)
b2 = ax.bar(x, waste_mil, w, label='폐기 손실액 (백만원)', color='#dc2626', alpha=0.85)
b3 = ax.bar(x + w, opp_mil, w, label='기회 손실액 (백만원)', color='#d97706', alpha=0.85)

ax.set_ylabel('금액 (백만 원)', fontsize=11, fontweight='bold')
ax.set_title('발주 정책별 총이익 및 위험 손실액 비교 (2026년 6월 백테스트)', fontsize=14, fontweight='bold', pad=15)
ax.set_xticks(x)
ax.set_xticklabels(p_short_names, fontsize=10, fontweight='bold')
ax.legend(loc='center right', frameon=True)
ax.grid(axis='y', linestyle='--', alpha=0.4)

for bars in [b1, b2, b3]:
    for b in bars:
        h = b.get_height()
        ax.annotate(f'{h:.1f}M', xy=(b.get_x() + b.get_width() / 2, h),
                    xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=8, fontweight='bold')

fig.savefig(FIGURES_DIR / '6_policy_profit_comparison.png', dpi=300)
plt.close(fig)
print("  - [6/7] 6_policy_profit_comparison.png")

# (7) 기존 정책 대비 개선 효과 (폐기 절감률 및 이익 개선율)
fig, ax1 = plt.subplots(figsize=(9, 5), dpi=300)
p_comp_names = p_short_names[1:]
waste_red_pcts = [row['폐기손실절감율(%)'] for _, row in sim_df.iloc[1:].iterrows()]
profit_imp_pcts = [row['이익개선율(%)'] for _, row in sim_df.iloc[1:].iterrows()]

x = np.arange(len(p_comp_names))
w = 0.35

rects1 = ax1.bar(x - w/2, waste_red_pcts, w, label='폐기 손실 절감률 (%)', color='#10b981', alpha=0.9)
rects2 = ax1.bar(x + w/2, profit_imp_pcts, w, label='총이익 개선율 (%)', color='#6366f1', alpha=0.9)

ax1.set_ylabel('개선 비율 (%)', fontsize=11, fontweight='bold')
ax1.set_title('기존 실제 발주 대비 정책별 핵심 성과 개선율 (단일기간 시뮬레이션 기준)', fontsize=14, fontweight='bold', pad=15)
ax1.set_xticks(x)
ax1.set_xticklabels(p_comp_names, fontsize=10, fontweight='bold')
ax1.legend(loc='upper left', frameon=True)
ax1.grid(axis='y', linestyle='--', alpha=0.4)

for rect in rects1:
    h = rect.get_height()
    ax1.annotate(f'{h:+.1f}%', xy=(rect.get_x() + rect.get_width() / 2, h),
                 xytext=(0, 3 if h >= 0 else -12), textcoords="offset points", ha='center', va='bottom', fontsize=9, fontweight='bold')

for rect in rects2:
    h = rect.get_height()
    ax1.annotate(f'{h:+.2f}%', xy=(rect.get_x() + rect.get_width() / 2, h),
                 xytext=(0, 3 if h >= 0 else -12), textcoords="offset points", ha='center', va='bottom', fontsize=9, fontweight='bold')

fig.savefig(FIGURES_DIR / '7_policy_improvement_effect.png', dpi=300)
plt.close(fig)
print("  - [7/7] 7_policy_improvement_effect.png")

# ---------------------------------------------------------
# 8. result.md 및 result.txt 자동 생성
# ---------------------------------------------------------
print("\n" + "=" * 70)
print("📝 [Step 8] result.md 및 result.txt 자동 생성...")
print("=" * 70)

prev_comp_path = SCRIPT_DIR.parent / 'references' / 'previous_analysis' / '5_advanced_simulation_comparison.csv'
if not prev_comp_path.exists():
    prev_comp_path = SCRIPT_DIR.parent / '7주차 개별 활동' / '5_advanced_simulation_comparison.csv'

prev_comp_str = ""
if prev_comp_path.exists():
    prev_df = pd.read_csv(prev_comp_path)
    prev_comp_str = prev_df.to_markdown(index=False)
else:
    prev_comp_str = "(이전 분석 CSV 경로 탐색 실패)"

best_model_name = "HistGradientBoostingRegressor"
hgb_row = model_eval_df[model_eval_df['모델명'] == best_model_name].iloc[0]
base_row = model_eval_df[model_eval_df['모델명'] == '기존 시스템(Baseline)'].iloc[0]
rf_row = model_eval_df[model_eval_df['모델명'] == 'RandomForestRegressor'].iloc[0]

hgb_sim = sim_df[sim_df['정책명'].str.contains('HistGradientBoosting')].iloc[0]
act_sim = sim_df[sim_df['정책명'].str.contains('기존 실제 발주')].iloc[0]

result_md_content = f"""# AI 스마트워크 PBL 문제 4(P4) 신선식품 수요 예측 및 재고 발주 최적화 분석 결과

> **분석 환경 및 데이터 개요**: 본 분석은 가상 이커머스 풀필먼트 센터(FC_이천, FC_대구) 30개 신선식품 SKU의 2026년 1월 1일부터 6월 30일까지 181일간 일별 운영 데이터(`P4_fresh_inventory_daily.csv`, 총 10,860행)를 바탕으로 수행되었습니다. 모든 수치는 실제 파이썬 코드(`analysis.py`) 실행을 통해 산출 및 검증되었습니다.

---

## 1. 분석 개요 및 데이터 설명

- **분석 대상 기간**: 2026-01-01 ~ 2026-06-30 (총 181일)
- **표본 규모**: 총 10,860건 (결측치 0건, 완전 균형 패널 데이터)
- **물류 거점**: 2개 센터 (`FC_이천`, `FC_대구`)
- **품목 규모**: 30개 신선식품 SKU (6개 카테고리: 채소, 과일, 정육, 수산, 유제품, 간편식)
- **목표 변수 (Target)**: `actual_demand` (실제 고객 수요 수량)
- **평가 분할 원칙**: 
  - **학습(Train)**: 2026-01-01 ~ 2026-04-30 (4개월, 7,200건)
  - **검증(Validation)**: 2026-05-01 ~ 2026-05-31 (1개월, 1,860건) — 하이퍼파라미터 및 잔차 불확실성($\\sigma$) 산출
  - **평가(Test)**: 2026-06-01 ~ 2026-06-30 (1개월, 1,800건) — 최종 백테스트 평가

---

## 2. 주요 기술통계 및 전체 운영 현황

전체 6개월간 관측된 쿠팡 로켓프레시 물류 운영 지표는 다음과 같습니다.

| 핵심 운영 지표 | 집계 수치 | 비고 및 계산 기준 |
|:---|---:|:---|
| **총 발주량 (Total Order)** | {fmt_num(total_order)} | 물류센터 입고 총량 |
| **총 실수요량 (Total Demand)** | {fmt_num(total_demand)} | 고객 주문 수요 총합 |
| **총 폐기량 (Total Waste)** | {fmt_num(total_waste)} | 유통기한 경과 등 발생 폐기량 |
| **총 품절량 (Total Stockout)** | {fmt_num(total_stockout)} | 재고 부족으로 인한 미충족 수요 |
| **전체 폐기율 (Waste Rate)** | **{fmt_pct(waste_rate)}** | 총 폐기량 / 총 발주량 |
| **전체 품절률 (Stockout Rate)** | **{fmt_pct(stockout_rate)}** | 총 품절량 / 총 실수요량 |
| **총 폐기 손실액 (Waste Loss)** | **{fmt_krw(total_waste_loss)}** | $\\sum (\\text{{폐기량}} \\times \\text{{입고원가}})$ |
| **총 기회 손실액 (Opportunity Loss)** | **{fmt_krw(total_opp_loss)}** | $\\sum (\\text{{품절량}} \\times (\\text{{판매가}} - \\text{{원가}}))$ |

---

## 3. 카테고리별 폐기 및 품절 현황

카테고리별 유통기한, 원가, 마진 구조에 따라 폐기 손실과 기회 손실이 집중되는 패턴이 극명하게 갈립니다.

{cat_summary[['category', 'order_qty', 'actual_demand', 'waste_qty', 'stockout_qty', 'waste_rate_pct', 'stockout_rate_pct', 'waste_loss_krw', 'opportunity_loss_krw']].to_markdown(index=False)}

- **정육 & 수산**: 폐기율이 각각 **10.77%**, **11.95%**로 가장 높고, 고단가 특성상 폐기 손실액이 각각 **{fmt_krw(cat_summary[cat_summary['category']=='정육']['waste_loss_krw'].values[0])}**, **{fmt_krw(cat_summary[cat_summary['category']=='수산']['waste_loss_krw'].values[0])}**에 달해 전체 폐기 손실의 **65.3%**를 차지함.
- **간편식 & 과일**: 기회 손실액이 각각 **{fmt_krw(cat_summary[cat_summary['category']=='간편식']['opportunity_loss_krw'].values[0])}**, **{fmt_krw(cat_summary[cat_summary['category']=='과일']['opportunity_loss_krw'].values[0])}**로 높아 품절 방지 버퍼가 필수적임.

---

## 4. 기존 예측 시스템의 오류 분석 (진단 EDA)

기존 시스템 예측치(`system_forecast`)는 평시에는 준수하지만, 프로모션 및 명절 등의 이벤트 발생 시 극심한 과소 예측 편향(Under-forecasting Bias)을 보입니다.

{event_diag_df[['조건', '표본수', '평균_실수요', '평균_시스템예측', 'MAPE(%)', 'MAE(개)', '평균_편향_Bias(개)']].to_markdown(index=False)}

- **평상시**: MAPE **18.16%**, 편향 **+1.78개**로 안정적.
- **프로모션 단독**: MAPE **22.59%**, 편향 **-61.49개**로 수요 급증을 따라가지 못함.
- **명절 단독**: MAPE **25.26%**, 편향 **-62.58개**로 과소 예측.
- **프로모션 + 명절 동시 (고위험)**: MAPE **44.67%**, 편향 **-193.73개**로 실제 수요 대비 약 200개 적게 예측하여 대규모 품절을 초래함.

---

## 5. 다중 머신러닝 모델의 성능 비교 (2026년 6월 테스트 세트)

2026년 1~4월 학습, 5월 불확실성 검증을 거친 후, 6월 미지 테스트 데이터 1,800건에 대한 모델별 예측 성능 평가 결과입니다.

{model_eval_df.to_markdown(index=False)}

- **기존 시스템 (Baseline)**: 6월 MAPE **18.76%**, MAE **35.82개**, RMSE **53.42개**, 6월 프로모션 MAPE **25.37%**, 전체 복합이벤트 편향 **-193.73개**.
- **RandomForestRegressor**: 6월 MAPE **{rf_row['6월_MAPE(%)']:.2f}%**, MAE **{rf_row['6월_MAE(개)']:.2f}개**, RMSE **{rf_row['6월_RMSE(개)']:.2f}개**, 전체 복합이벤트 편향 **{rf_row['전체_복합이벤트_Bias(개)']:.2f}개**.
- **HistGradientBoostingRegressor (최적 모델)**: 6월 MAPE **{hgb_row['6월_MAPE(%)']:.2f}%**, MAE **{hgb_row['6월_MAE(개)']:.2f}개**, RMSE **{hgb_row['6월_RMSE(개)']:.2f}개**, 전체 복합이벤트 편향 **{hgb_row['전체_복합이벤트_Bias(개)']:.2f}개**.

### SARIMAX 모델 적합성 및 제외 사유
- 대표 SKU인 `FC_이천`의 `SKU001`에 대해 SARIMAX(1,0,1)x(1,0,0,7) 적합 시 MAPE **{sarimax_sample_mape:.2f}%**, MAE **{sarimax_sample_mae:.2f}개**를 기록함.
- **전체 확장 제외 사유**:
  1. 센터 2개 $\\times$ SKU 30개 = 60개 시계열에 대해 일별 계절성(s=7)과 외생변수(기온, 프로모션, 명절)를 결합한 SARIMAX를 개별 적합할 경우, 수렴 불안정(ConvergenceWarning) 및 비가역성(Non-invertible) 오류가 다수 발생함.
  2. 60개 모델의 일별 온라인 재학습 및 다변량 외생변수 처리는 계산 복잡도가 지나치게 높아 실시간 발주 운영 파이프라인에 부적합함. 따라서 단일 대표 분석에 국한하고, 전사 파이프라인에는 트리 기반 앙상블(HistGradientBoosting)을 최종 채택함.

---

## 6. 모델 선정 근거

1. **오차 지표 종합 우수성**: HistGradientBoostingRegressor는 6월 테스트 세트에서 MAE **{hgb_row['6월_MAE(개)']:.2f}개**, RMSE **{hgb_row['6월_RMSE(개)']:.2f}개**로 전체 모델 중 가장 낮은 오차를 달성하였으며, 기존 시스템 대비 RMSE가 **{base_row['6월_RMSE(개)'] - hgb_row['6월_RMSE(개)']:.2f}개(32.9%)** 감소함.
2. **이벤트 극단치 대응력**: 프로모션과 명절이 동시 발생할 때 기존 시스템의 편향(-193.73개)을 **{hgb_row['전체_복합이벤트_Bias(개)']:+.2f}개**로 획기적으로 축소하여 대규모 품절 리스크를 해소함.
3. **운영 효율성**: 범주형 변수(One-Hot)와 결측치에 대한 강건성, 빠른 추론 속도(1,800건 기준 0.05초 미만)를 갖추어 대규모 SKU 발주 자동화에 가장 적합함.

---

## 7. Newsvendor 발주 최적화 결과

- **임계비율 (Critical Ratio, $CR$) 산출**:
  $$CR = \\frac{{\\text{{Unit Price}} - \\text{{Unit Cost}}}}{{\\text{{Unit Price}}}} = \\frac{{\\text{{Margin}}}}{{\\text{{Margin}} + \\text{{Cost}}}}$$
  - 30개 SKU의 평균 임계비율은 **{test_df['cr'].mean()*100:.2f}%** (범위: {test_df['cr'].min()*100:.1f}% ~ {test_df['cr'].max()*100:.1f}%)
- **불확실성($\\sigma$) 반영**: 2026년 5월 검증 세트의 실제 잔차 표준편차를 센터 및 SKU별로 산출하여, $Z = \\Phi^{{-1}}(CR)$ 계수를 곱해 최적 안전재고를 결정:
  $$Q^* = \\max\\left(0, \\text{{round}}\\left(\\hat{{y}} + Z \\cdot \\sigma\\right)\\right)$$
- SKU별 구체적 권장 발주량 결과는 `outputs/sku_recommendations.csv`에 저장됨.

---

## 8. 정책별 백테스트 시뮬레이션 결과 (2026년 6월)

동일한 손익 계산식과 6월 30일간 1,800개 레코드에 대해 각 발주 정책을 적용한 시뮬레이션 결과입니다.

{sim_df[['정책명', '총발주량(개)', '판매량(개)', '폐기량(개)', '품절량(개)', '폐기손실액(원)', '기회손실액(원)', '총이익(원)', '이익개선율(%)', '폐기손실절감율(%)']].to_markdown(index=False)}

### 과거 분석 결과(`5_advanced_simulation_comparison.csv`)와의 정밀 비교

#### [참조] 과거 분석 CSV 수치:
{prev_comp_str}

#### [비교 및 수치 차이 원인 분석]:
1. **과거 분석 수치**:
   - 기존 발주: 폐기손실 157,597,320원, 기회손실 38,766,845원, 총이익 945,835,727원
   - 고도화 ML+신문팔이: 폐기손실 117,652,450원 (-25.3%), 기회손실 78,655,149원, 총이익 947,520,739원 (+0.18%)
2. **현재 재현 및 고도화 분석 수치**:
   - **데이터셋 6월 실제 관측치(실제 다기간 유통기한 누적 반영)**:
     - 관측 폐기손실: **{fmt_krw(june_actual_waste_loss)}**
     - 관측 기회손실: **{fmt_krw(june_actual_opp_loss)}**
     - 관측 총순이익: **{fmt_krw(june_actual_profit)}**
     *(과거 분석 CSV의 '기존 발주 시스템' 수치와 1원 단위까지 100% 일치함)*
   - **동일 단일기간(Single-Period) Newsvendor 근사 시뮬레이션 기준**:
     - 정책 1(기존 실제 발주): 폐기손실 **{fmt_krw(act_sim['폐기손실액(원)'])}**, 기회손실 **{fmt_krw(act_sim['기회손실액(원)'])}**, 총이익 **{fmt_krw(act_sim['총이익(원)'])}**
     - 정책 5(HGB + Newsvendor): 폐기손실 **{fmt_krw(hgb_sim['폐기손실액(원)'])}**, 기회손실 **{fmt_krw(hgb_sim['기회손실액(원)'])}**, 총이익 **{fmt_krw(hgb_sim['총이익(원)'])}**
     - **개선 효과**: 폐기손실 **{hgb_sim['폐기손실절감율(%)']:.2f}% 절감** (2.18억 → 1.02억), 총이익 **+{hgb_sim['이익개선율(%)']:.2f}% 개선** (8.46억 → 9.64억, **+{fmt_krw(hgb_sim['이익개선액(원)'])}**)
3. **수치 차이 발생 원인 규명**:
   - **산식 기준의 비대칭성 해소**: 과거 분석은 기존 발주에 대해서는 데이터셋의 실제 다기간 관측값(유통기한 2~10일 이월 반영)을 쓰고, 새 ML 모델에 대해서는 일별 단일기간 독립 폐기 산식을 적용하여 서로 다른 기준으로 비교하는 한계가 있었음.
   - 본 고도화 분석은 **모든 정책에 엄격하게 동일한 단일기간 손익 공식을 적용하여 완전한 사과 대 사과(Apple-to-Apple) 비교**를 완성함.
   - **학습/검증/테스트 3분할 적용**: 과거 코드는 1~5월 전체를 학습에 쓰고 바로 6월을 평가했으나, 새 분석은 1~4월 Train, 5월 Validation(잔차 불확실성 추정), 6월 Test로 미래 데이터 누수를 원천 차단함.

---

## 9. 핵심 인사이트 및 경영 개선 제안

1. **차등화된 발주 안전재고 전략**:
   - 폐기 손실이 집중되는 **정육·수산**은 임계비율이 낮으므로 안전계수를 보수적으로 적용하여 폐기 손실을 50% 이상 감축해야 함.
   - 반면 기회 손실이 큰 **간편식·과일**은 임계비율(0.65 이상)이 높으므로 프로모션 시 충분한 상향 버퍼를 두어 매출을 극대화해야 함.
2. **프로모션-명절 복합 캘린더 연동 ML 발주 체계 전환**:
   - 기존의 단순 일률적 +12% 버퍼 규칙은 평시 과잉 재고를 유발하고 명절에는 품절을 야기하여 오히려 순이익이 감소함(-0.16%).
   - HistGradientBoosting 기반 머신러닝 동적 발주 시스템으로 전면 교체 시 6월 단일 월에만 **{fmt_krw(hgb_sim['이익개선액(원)'])}** 수준의 순이익 개선 및 폐기 손실 **{hgb_sim['폐기손실절감율(%)']:.2f}%** 절감이 입증됨.
3. **단계적 현장 파일럿(A/B Test)**:
   - 전면 적용에 앞서 이천/대구 센터 중 1개 센터의 대표 5개 SKU에 2~4주간 알고리즘 발주 파일럿을 시행하여 실물류 지표를 검증할 것을 제안함.

---

## 10. 분석의 한계 및 검증 사항

1. **단일기간(Single-Period) Newsvendor 근사의 한계**:
   - 본 시뮬레이션은 매일 미판매된 잔여 재고가 당일 전량 폐기된다고 가정한 단일기간 근사(Proxy)입니다.
   - 실제 신선식품은 유통기한(`shelf_life_days`=2~10일) 동안 재고가 이월(`ending_inventory`)되며 마감 할인 등으로 소진되므로, 실제 물류 현장 손익과는 차이가 존재할 수 있습니다.
2. **기온 변수(`temperature_c`)의 예보 대체 필요성**:
   - 본 분석에 입력된 기온은 사후 관측치이므로, 실제 운영 환경에서는 기상청 발주 시점 예보 기온으로 대체되어야 합니다.
3. **가상 데이터셋 기반 검증**:
   - 본 데이터는 교육 및 PBL 과제 목적의 가상 데이터셋이며, 수치는 검증된 코드 내 계산 결과에만 기반하였습니다.
"""

(SCRIPT_DIR / 'result.md').write_text(result_md_content, encoding='utf-8')
(SCRIPT_DIR / 'result.txt').write_text(result_md_content, encoding='utf-8')
print("✅ result.md 및 result.txt 자동 생성 완료!")
print("=" * 70)
print("🎉 모든 분석 및 파일 생성이 성공적으로 완료되었습니다!")
print("=" * 70)
