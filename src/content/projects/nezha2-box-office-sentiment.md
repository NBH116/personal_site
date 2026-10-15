---
title: "《哪吒 2》时序舆情演化与情感驱动的票房响应研究"
description: "用 SEIR 模型划分舆情生命周期、BERT-wwm 量化观众情感时序演化，再以 VAR 模型挖掘情感与票房之间的双向滞后关联。"
date: "2025-03-01"
tags: ["BERT", "VAR 模型", "SEIR", "数据爬取"]
role: "核心成员"
period: "2025.03 - 2025.06"
featured: true
status: "active"
---

## 项目背景

电影宣发长期依赖「经验判断」：口碑好不好、什么时候加大投放，多数时候靠直觉。学术上对影视舆情的研究又偏向静态定性——把一部电影的评论整体打一个「正面/负面」标签，得出「口碑好票房高」这类结论。

这种静态做法回答不了宣发真正关心的问题：**口碑的变化在什么时候、以多长的滞后期、以多大强度影响票房？** 如果情感领先票房 3 天，那第 3 天就是追加投放的窗口；如果票房领先情感，说明驱动关系反了，投放策略要换方向。

项目要做的就是把这个「滞后结构」量化出来。

## 技术路线

整体是一条从原始评论到滞后关联的流水线：

```text
多平台影评 → 清洗与标准化 → BERT-wwm 情感量化 → 舆情生命周期划分（SEIR）→ VAR 滞后分析 → 宣发策略
```

### 舆情生命周期划分

用 SEIR 传染病模型的框架类比舆情传播，把「潜伏 — 爆发 — 衰减」的过程映射为易感者、暴露者、感染者、移除者四类人群的转化。这样做的价值是给舆情阶段一个**可计算的切分点**，而不是靠观察曲线的拐点主观判断。

### 情感量化

情感不是二分类。同样一条负向评论，「演技一般」和「剧情崩了」对购票决策的影响强度完全不同。因此模型输出的是**带强度的情感分值**，而不是硬标签。

## 我的工作

- **多平台影评数据爬取、清洗与标准化数据集构建**：处理去重、水印与营销文案剔除、时间戳对齐，形成统一结构的时序数据集。
- **BERT-wwm 影评情感分类与强度量化分析**。
- **VAR 时序计量模型的搭建**：解析口碑情感对票房的滞后驱动效应。
- **实证图表可视化与研究报告撰写**。

### 数据清洗里最容易被忽略的一步

爬下来的影评里混着大量非观影反馈：抽奖转发、重复刷屏、同一条文案被多个账号批量发布。这类样本会系统性地拉高情感均值的方差，如果不剔除，BERT 的输出会显得「噪声很大」，而问题其实在数据侧。

```python
def drop_marketing_noise(frame: pd.DataFrame, threshold: float = 0.85) -> pd.DataFrame:
    """剔除同质化刷屏内容：同一时间段内文本相似度过高即判定为营销或水军。"""
    frame = frame.drop_duplicates(subset=["user_id", "content"])

    # 按小时分桶后做局部相似度比对，避免全局两两比较的 O(n^2) 开销
    keep = []
    for _, bucket in frame.groupby(frame["posted_at"].dt.floor("1h")):
        seen: list[str] = []
        for row in bucket.itertuples():
            if any(similarity(row.content, text) > threshold for text in seen):
                continue
            seen.append(row.content)
            keep.append(row.Index)

    return frame.loc[keep]
```

### VAR 模型的定阶

VAR 对滞后阶数很敏感：阶数太低抓不到滞后效应，太高会让参数数量膨胀、估计不稳定。这里用 AIC 与 BIC 联合定阶，两个准则给出不同结果时取较小的阶数，宁可低估也不让模型过拟合。

```python
from statsmodels.tsa.api import VAR

model = VAR(train[["sentiment", "box_office"]])

# 两个准则不一致时取较小阶数：宁可少抓滞后，也不要过拟合
order = min(model.select_order(maxlags=7).aic, model.select_order(maxlags=7).bic)
results = model.fit(order)

# 格兰杰因果检验：确认情感对票房确实存在预测能力，而不是伪相关
print(results.test_causality("box_office", ["sentiment"], kind="f").summary())
```

## 成果

- 获**第十一届全国大学生统计建模大赛省级一等奖**。
- 输出的影视全周期宣发策略与研究方法论，可复用于其他内容类产品的口碑分析。

## 复盘

VAR 给出的是统计意义上的领先—滞后关系，不是因果证明。项目里补了格兰杰因果检验作为佐证，但报告中始终把它表述为「预测能力」而非「因果驱动」——这一处措辞上的克制，比多跑几个模型更重要。

另外，情感与票房的滞后关系在舆情不同阶段并不一致。爆发期的滞后明显更短，说明观众在这一阶段对口碑的反应更敏感。这提示后续工作应该做**分阶段建模**，而不是在全周期上估一个统一系数。
