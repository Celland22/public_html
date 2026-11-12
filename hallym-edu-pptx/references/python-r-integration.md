# Python/R Analysis Integration Guide

This guide explains how to integrate Python or R analysis results into PowerPoint presentations using the Hallym Educational PPTX skill.

## Workflow Overview

```
[Analysis in Python/R] → [Export Results] → [Generate HTML Slides] → [Convert to PPTX]
```

## Step 1: Prepare Your Analysis Results

### Python Example

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix, classification_report
import json

# Your analysis code here
model = RandomForestClassifier()
# ... training code ...

# Save plots
plt.figure(figsize=(10, 6))
sns.barplot(x='feature', y='importance', data=feature_importance_df)
plt.title('Feature Importance')
plt.tight_layout()
plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
plt.close()

# Save confusion matrix
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.title('Confusion Matrix')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.tight_layout()
plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
plt.close()

# Export results to JSON
results = {
    "accuracy": float(accuracy_score(y_test, y_pred)),
    "precision": float(precision_score(y_test, y_pred, average='weighted')),
    "recall": float(recall_score(y_test, y_pred, average='weighted')),
    "f1_score": float(f1_score(y_test, y_pred, average='weighted'))
}

with open('model_metrics.json', 'w') as f:
    json.dump(results, f, indent=2)
```

### R Example

```r
library(ggplot2)
library(randomForest)
library(caret)
library(jsonlite)

# Your analysis code here
model <- randomForest(target ~ ., data = train_data)

# Save plots
png("feature_importance.png", width=10, height=6, units="in", res=300)
varImpPlot(model, main="Feature Importance")
dev.off()

# Save confusion matrix plot
cm <- confusionMatrix(predictions, test_data$target)
png("confusion_matrix.png", width=8, height=6, units="in", res=300)
fourfoldplot(cm$table, color = c("#CC6666", "#99CC99"),
             conf.level = 0, margin = 1, main = "Confusion Matrix")
dev.off()

# Export results to JSON
results <- list(
  accuracy = cm$overall['Accuracy'],
  kappa = cm$overall['Kappa'],
  sensitivity = cm$byClass['Sensitivity'],
  specificity = cm$byClass['Specificity']
)

write_json(results, "model_metrics.json", pretty = TRUE)
```

## Step 2: Structure Your Presentation Content

Use the `export_analysis_results.py` script to create a structured JSON:

```python
from export_analysis_results import *

# Create base structure
structure = create_analysis_structure(
    title="머신러닝을 활용한 고객 이탈 예측 모델",
    subtitle="한림대학교 경영학과 황현석 교수"
)

# Add sections
structure['sections'].extend([
    # Section 1: Background
    {
        "type": "section_header",
        "title": "1. 연구 배경 및 목적",
        "content": "고객 이탈은 기업의 주요 관심사이며..."
    },
    
    # Section 2: Methodology
    add_methodology_section(
        title="연구 방법론",
        description="Random Forest 알고리즘을 활용한 이탈 예측 모델 개발",
        diagram_path="methodology_diagram.png",
        key_points=[
            "데이터 수집: 3년간의 고객 거래 데이터 (N=10,000)",
            "특성 엔지니어링: 50개의 파생 변수 생성",
            "모델 학습: Random Forest (n_estimators=100)",
            "교차 검증: 5-fold cross-validation",
            "성능 평가: Accuracy, Precision, Recall, F1-score"
        ]
    ),
    
    # Section 3: Results
    add_visualization_section(
        title="모델 성능 평가",
        description="개발된 모델의 성능 지표 및 혼동 행렬",
        plot_paths=[
            "confusion_matrix.png",
            "roc_curve.png"
        ],
        interpretation="모델의 정확도는 87.5%로 높은 예측 성능을 보임"
    ),
    
    add_visualization_section(
        title="주요 예측 변수 분석",
        description="고객 이탈에 영향을 미치는 주요 변수들",
        plot_paths=["feature_importance.png"],
        interpretation="계약 기간, 월 사용량, 고객 서비스 이용 횟수가 주요 예측 변수"
    ),
    
    # Section 4: Case Study
    add_case_study_section(
        title="A기업 적용 사례",
        context="국내 통신사 A기업에서 고객 이탈 예측 모델 도입",
        problem="연간 15%의 높은 고객 이탈률로 인한 매출 감소",
        solution="예측 모델 기반 선제적 고객 관리 전략 수립",
        results=[
            "고객 이탈률 15% → 9%로 감소 (6%p 개선)",
            "고위험 고객 대상 맞춤형 리텐션 프로그램 운영",
            "연간 약 50억원의 매출 손실 방지",
            "고객 만족도 12% 향상"
        ],
        image_path="case_study_results.png"
    ),
    
    # Section 5: Practical Implications
    {
        "type": "implications",
        "title": "실무 적용 시사점",
        "key_points": [
            "조기 경보 시스템: 이탈 위험 고객 사전 식별",
            "차별화된 고객 관리: 위험 수준별 맞춤 전략",
            "자원 효율화: 고위험 고객 집중 관리로 비용 절감",
            "지속적 모델 개선: 정기적인 재학습으로 성능 유지"
        ]
    }
])

# Export to JSON
export_to_json(structure, "presentation_structure.json")
```

## Step 3: Common Visualization Types

### Feature Importance Plot

```python
import matplotlib.pyplot as plt
import seaborn as sns

def plot_feature_importance(model, feature_names, top_n=10):
    """Plot top N important features"""
    importances = model.feature_importances_
    indices = importances.argsort()[-top_n:][::-1]
    
    plt.figure(figsize=(10, 6))
    plt.barh(range(top_n), importances[indices], color='#0B3A6F')
    plt.yticks(range(top_n), [feature_names[i] for i in indices])
    plt.xlabel('Feature Importance', fontsize=12)
    plt.title('Top {} Important Features'.format(top_n), fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
    plt.close()
```

### Confusion Matrix

```python
def plot_confusion_matrix(y_true, y_pred, labels=None):
    """Plot confusion matrix with percentages"""
    from sklearn.metrics import confusion_matrix
    import numpy as np
    
    cm = confusion_matrix(y_true, y_pred)
    cm_percent = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis] * 100
    
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm_percent, annot=True, fmt='.1f', cmap='Blues', 
                xticklabels=labels, yticklabels=labels, cbar_kws={'label': 'Percentage (%)'})
    plt.ylabel('Actual', fontsize=12)
    plt.xlabel('Predicted', fontsize=12)
    plt.title('Confusion Matrix (%)', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
    plt.close()
```

### ROC Curve

```python
def plot_roc_curve(y_true, y_scores):
    """Plot ROC curve with AUC"""
    from sklearn.metrics import roc_curve, auc
    
    fpr, tpr, _ = roc_curve(y_true, y_scores)
    roc_auc = auc(fpr, tpr)
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='#0B3A6F', lw=2, 
             label=f'ROC curve (AUC = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='gray', lw=1, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate', fontsize=12)
    plt.ylabel('True Positive Rate', fontsize=12)
    plt.title('Receiver Operating Characteristic (ROC) Curve', fontsize=14, fontweight='bold')
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig('roc_curve.png', dpi=300, bbox_inches='tight')
    plt.close()
```

### Distribution Plots

```python
def plot_distribution_comparison(data, feature, target, labels=None):
    """Compare feature distributions across target classes"""
    plt.figure(figsize=(10, 6))
    
    for i, label in enumerate(data[target].unique()):
        subset = data[data[target] == label][feature]
        plt.hist(subset, alpha=0.6, label=labels[i] if labels else f'Class {label}', bins=30)
    
    plt.xlabel(feature, fontsize=12)
    plt.ylabel('Frequency', fontsize=12)
    plt.title(f'Distribution of {feature} by Class', fontsize=14, fontweight='bold')
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(f'{feature}_distribution.png', dpi=300, bbox_inches='tight')
    plt.close()
```

## Step 4: Create Results Summary Table

```python
def create_results_table(metrics):
    """Create a formatted results table"""
    import pandas as pd
    
    # Create DataFrame
    df = pd.DataFrame({
        '지표': ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
        '점수': [f"{metrics['accuracy']:.3f}", 
                 f"{metrics['precision']:.3f}",
                 f"{metrics['recall']:.3f}",
                 f"{metrics['f1_score']:.3f}"],
        '해석': ['전체 예측 정확도', '양성 예측의 정확도', 
                '실제 양성 중 탐지 비율', '정밀도와 재현율의 조화 평균']
    })
    
    # Save to CSV for easy insertion into slides
    df.to_csv('model_metrics_table.csv', index=False, encoding='utf-8-sig')
    
    return df
```

## Tips for Better Visualizations

1. **Use consistent colors**: Match the template's "PGO - Academic Prestige" palette (see `references/color-palette.md`)
   - Primary (Accent 1, Navy): #0B3A6F
   - Secondary (Accent 2, Gold): #C99B43
   - Tertiary (Accent 6, Slate): #6D7F95

2. **Font sizes**: Use readable font sizes (12-14pt for labels)

3. **High resolution**: Save at 300 DPI for clarity

4. **Aspect ratio**: Consider the slide layout when choosing plot dimensions

5. **Korean fonts**: Match the deck's font policy (한글 = 함초롬바탕, 영문 = Calibri). Matplotlib/seaborn usually don't have 함초롬바탕 installed in the sandbox, so fall back to a Korean-capable sans font for chart labels — the font mismatch is invisible once the PNG is placed on a slide:
   ```python
   plt.rcParams['font.family'] = 'Malgun Gothic'  # or 'NanumGothic' if available
   plt.rcParams['axes.unicode_minus'] = False
   ```

## Complete Example Workflow

```python
# Complete analysis script
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from export_analysis_results import *

# Set plotting style
plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False
sns.set_palette(['#0B3A6F', '#C99B43', '#6D7F95'])

# Load and prepare data
data = pd.read_csv('customer_data.csv')
X = data.drop('churn', axis=1)
y = data['churn']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# Generate all visualizations
plot_feature_importance(model, X.columns)
plot_confusion_matrix(y_test, y_pred, labels=['Stay', 'Churn'])
plot_roc_curve(y_test, model.predict_proba(X_test)[:, 1])

# Create results structure
structure = create_analysis_structure(
    title="고객 이탈 예측 모델 개발 및 적용",
    sections=[...] # As shown in Step 2
)

# Export
export_to_json(structure, "presentation_structure.json")
print("✅ All results exported successfully!")
print("📊 Generated visualizations:")
print("  - feature_importance.png")
print("  - confusion_matrix.png")
print("  - roc_curve.png")
print("📄 Next: Use these files to create your PPTX presentation")
```

## Next Steps

After exporting your analysis results:

1. Review the generated JSON structure
2. Duplicate the needed slide type(s) from `assets/template.pptx` with `add_slide.py` (see main `SKILL.md`)
3. Place your PNG visualizations into the content slide's image placeholder and write the interpretation as bullet text
4. Run `validate.py --original assets/template.pptx` and the visual QA steps in `SKILL.md`
5. Add any final touches in PowerPoint (animations, transitions, etc.)
