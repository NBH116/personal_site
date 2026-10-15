---
title: "把影评情感量化成票房的前置指标：BERT 与 VAR 的组合用法"
description: "情感分类的准确率不是终点。要把情感变成可用的票房前置指标，关键是量化强度、保住时序结构，再用 VAR 检验滞后关系。"
date: "2025-06-20"
tags: ["BERT", "VAR", "时序分析", "数据爬取"]
---

## 为什么二分类情感不够用

给影评打「正面 / 负面」标签看起来很直观，但落到票房分析上几乎没有可用性。原因是**强度和方向同样重要**：一条「还行」和一条「强烈推荐」都是正面，但它们对购票决策的推动力差了一个量级。如果只保留方向，情感序列会退化成一条几乎恒定的曲线（大片的口碑均值通常都是正的），自然也就看不出与票房的关系。

所以这里要输出的是**带强度的连续情感分值**。

## 用 BERT-wwm 输出强度而不是标签

做法是把分类头的 softmax 概率转成有符号的分值：正向概率减负向概率，得到 `[-1, 1]` 区间的强度值。

```python
import torch
import torch.nn.functional as F

@torch.no_grad()
def score_sentiment(texts: list[str], model, tokenizer, batch_size: int = 64) -> list[float]:
    """输出 [-1, 1] 的情感强度：正向概率 - 负向概率。"""
    scores: list[float] = []

    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        encoded = tokenizer(batch, padding=True, truncation=True, max_length=256, return_tensors="pt")

        logits = model(**encoded).logits
        probabilities = F.softmax(logits, dim=-1)

        # 假设 label 0 为负向、label 1 为正向
        scores.extend((probabilities[:, 1] - probabilities[:, 0]).tolist())

    return scores
```

这样一条「一般般」的正面评论分值可能是 0.05，而「强烈推荐」能到 0.9。序列的信息量一下子就出来了。

## 保住时序结构：按天聚合

断点在这里很关键。逐条评论的情感值噪声极大，直接送进时序模型会被噪声主导。聚合到**日粒度**之后信噪比才够用：

```python
daily = (
    reviews.assign(sentiment=score_sentiment(reviews["content"].tolist(), model, tokenizer))
    .groupby(reviews["posted_at"].dt.floor("D"))
    .agg(
        sentiment_mean=("sentiment", "mean"),
        sentiment_std=("sentiment", "std"),
        volume=("sentiment", "size"),
        # 极端负向评论占比，用它捕捉口碑崩塌这类非线性事件
        negative_ratio=("sentiment", lambda s: (s < -0.5).mean()),
    )
    .asfreq("D")
)
```

`sentiment_std` 和 `negative_ratio` 是刻意留下的：只用均值会丢失「争议性」这个维度。一部争议很大的电影，均值可能很普通，但方差和极端负向占比都很高。

## VAR：先定阶，再看滞后

VAR 模型对滞后阶数很敏感。阶数过低抓不到滞后效应，过高会让待估参数迅速膨胀。用 AIC 与 BIC 联合定阶，两者不一致时取小值。

```python
from statsmodels.tsa.api import VAR

def fit_var(frame, maxlags: int = 7):
    model = VAR(frame)

    ic = model.select_order(maxlags=maxlags)
    order = min(ic.aic, ic.bic)  # 宁可少抓滞后，也不要过拟合

    results = model.fit(order)

    # 检验情感对票房的预测能力，而非因果
    causality = results.test_causality("box_office", ["sentiment"], kind="f")

    return results, order, causality
```

### 结果的表述要克制

格兰杰因果检验的原假设是「前者不能改善对后者的预测」，它**不能**证明因果。报告里我把结论写成「情感对票房具有预测能力，滞后 k 期」，而不是「情感导致票房变化」。这个区别在评审时被明确肯定过——统计工具给的是证据强度，不是因果结论。

## 一个后续想做的方向

滞后关系在全周期上并不稳定：舆情爆发期的滞后明显短于衰减期。这意味着估一个统一系数是在做平均，掩盖了阶段差异。

下一步更合理的做法是**按舆情生命周期分段建模**：用 SEIR 划分出潜伏期、爆发期、衰减期，各段分别估滞后系数。这样得到的结论才真正对应宣发的实际决策节点——什么时候加投、什么时候撤。
