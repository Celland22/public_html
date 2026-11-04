import pandas as pd
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from scipy.stats import norm
import warnings
warnings.filterwarnings('ignore')

# 1. 데이터 불러오기 및 파생변수 생성
df = pd.read_csv('P4_fresh_inventory_daily.csv')
df['margin_krw'] = df['unit_price_krw'] - df['unit_cost_krw']
df['waste_loss_krw'] = df['unit_cost_krw'] * df['waste_qty']
df['opportunity_loss_krw'] = df['margin_krw'] * df['stockout_qty']
df['profit_krw'] = (df['sold_qty'] * df['unit_price_krw']) - (df['order_qty'] * df['unit_cost_krw'])

# --- [과제 1] 카테고리별 요약 분석 ---
cat_summary = df.groupby('category').agg({
    'order_qty': 'sum', 'actual_demand': 'sum', 
    'waste_qty': 'sum', 'stockout_qty': 'sum',
    'waste_loss_krw': 'sum', 'opportunity_loss_krw': 'sum'
}).reset_index()
cat_summary['waste_rate_pct'] = cat_summary['waste_qty'] / cat_summary['order_qty'] * 100
cat_summary['stockout_rate_pct'] = cat_summary['stockout_qty'] / cat_summary['actual_demand'] * 100
cat_summary.to_csv('1_category_summary.csv', index=False, encoding='utf-8-sig')

# --- [과제 2] 기존 시스템 예측 오차 진단 (MAPE, 편향) ---
df['system_bias'] = df['system_forecast'] - df['actual_demand']
df['system_ape'] = np.abs(df['system_bias']) / df['actual_demand']

sys_error_summary = df.groupby(['promo_flag', 'holiday_flag']).agg({
    'system_bias': 'mean',
    'system_ape': lambda x: x.mean() * 100
}).reset_index()
sys_error_summary.to_csv('2_system_error_summary.csv', index=False, encoding='utf-8-sig')

# --- [과제 3~5] 수요 예측 고도화 및 최적 발주량 시뮬레이션 ---
# 시계열 데이터를 위해 SKU, 센터, 날짜순으로 정렬
df = df.sort_values(by=['sku_id', 'center', 'date']).reset_index(drop=True)

# 1일 전, 7일 전 수요 및 이동평균 파생변수 추가
df['lag_1'] = df.groupby(['sku_id', 'center'])['actual_demand'].shift(1)
df['lag_7'] = df.groupby(['sku_id', 'center'])['actual_demand'].shift(7)
df['roll_mean_3'] = df.groupby(['sku_id', 'center'])['lag_1'].rolling(3, min_periods=1).mean().reset_index(drop=True)
df['roll_mean_7'] = df.groupby(['sku_id', 'center'])['lag_1'].rolling(7, min_periods=1).mean().reset_index(drop=True)

features = ['system_forecast', 'lag_1', 'lag_7', 'roll_mean_3', 'roll_mean_7', 'promo_flag', 'holiday_flag', 'temperature_c']
df_ml = df.dropna(subset=features)

# 최근 1개월(6월) 데이터로 평가 분할
train = df_ml[df_ml['date'] < '2026-06-01'].copy()
test = df_ml[df_ml['date'] >= '2026-06-01'].copy()

# 고성능 부스팅 모델(HistGradientBoosting) 적용
model = HistGradientBoostingRegressor(max_iter=300, random_state=42)
model.fit(train[features], train['actual_demand'])

test['ml_forecast'] = model.predict(test[features])
train['pred'] = model.predict(train[features])

# SKU별 실제 잔차(오차) 표준편차 도출
train['residual'] = train['actual_demand'] - train['pred']
residual_std = train.groupby('sku_id')['residual'].std().to_dict()
test['std_error'] = test['sku_id'].map(residual_std).fillna(train['residual'].std())

# Newsvendor 임계비율 및 Z-score 산출 (-2 ~ 2 클리핑)
test['critical_ratio'] = test['margin_krw'] / (test['margin_krw'] + test['unit_cost_krw'])
test['z_score'] = norm.ppf(test['critical_ratio'])
test['z_score'] = np.clip(test['z_score'], -2, 2) 

# 최종 발주량 산출 = 예측치 + (Z-score * 잔차 표준편차)
test['new_order_qty'] = np.ceil(test['ml_forecast'] + test['z_score'] * test['std_error'])
test['new_order_qty'] = np.maximum(test['new_order_qty'], 0)

# 새 정책 적용 시뮬레이션 성과 계산
test['new_sold_qty'] = test[['new_order_qty', 'actual_demand']].min(axis=1)
test['new_waste_qty'] = np.maximum(test['new_order_qty'] - test['actual_demand'], 0)
test['new_stockout_qty'] = np.maximum(test['actual_demand'] - test['new_order_qty'], 0)

test['new_waste_loss'] = test['new_waste_qty'] * test['unit_cost_krw']
test['new_opp_loss'] = test['new_stockout_qty'] * test['margin_krw']
test['new_profit'] = (test['new_sold_qty'] * test['unit_price_krw']) - (test['new_order_qty'] * test['unit_cost_krw'])

sim_comparison = pd.DataFrame({
    'Policy': ['기존 발주 시스템', '고도화된 ML + 신문팔이 최적화'],
    'Total_Waste_Loss_KRW': [test['waste_loss_krw'].sum(), test['new_waste_loss'].sum()],
    'Total_Opp_Loss_KRW': [test['opportunity_loss_krw'].sum(), test['new_opp_loss'].sum()],
    'Total_Profit_KRW': [test['profit_krw'].sum(), test['new_profit'].sum()]
})
sim_comparison.to_csv('5_advanced_simulation_comparison.csv', index=False, encoding='utf-8-sig')

print("✅ 모든 과제(1~5번) 고도화 분석 완료! 좌측에 3개의 파일이 생성되었습니다.")
print(sim_comparison.to_string(index=False))