---
title: "基于 AI 技术下电晕放电伏安特性的探究"
description: "搭建针-板电极电晕放电实验平台，构建融合物理约束的深度神经网络预测放电电流，RMSE 低至 0.1165mA，精度较传统经验公式提升超 40%。"
date: "2025-03-02"
tags: ["深度学习", "物理约束", "特征工程", "数据分析"]
role: "核心成员"
period: "2025.03 - 2025.08"
featured: true
status: "active"
---

## 项目背景

电晕放电是高压输变电设备绝缘劣化的早期征兆之一，准确刻画其伏安特性对放电特性研究和跨学科实验教学都有意义。实验平台采集的是不同针尖曲率、不同放电间隙下的伏安特性数据。

难点集中在**高电压区域**：这一段的电流数据波动明显变大，放电过程本身带有随机性，传统经验公式在该区间的拟合精度显著下降。项目因此尝试用数据驱动的方法，看看能不能把精度推上去。

## 技术路线：物理实验 + AI

核心思路是**不让神经网络自由地拟合一切**。纯数据驱动的模型在高电压区容易过拟合噪声，甚至给出违背物理规律的预测（例如随电压升高电流反而下降）。因此在损失函数中加入物理约束项，让模型在拟合数据的同时保持物理一致性。

### 融合物理约束的损失函数

物理约束项惩罚的是「预测电流随电压的变化方向与物理规律不一致」的样本。这样即使某个电压点噪声很大，模型也不会为了迁就它而破坏整体的单调性。

```python
def physics_constrained_loss(pred: torch.Tensor, target: torch.Tensor, voltage: torch.Tensor) -> torch.Tensor:
    """数据项 + 单调性约束。

    电晕放电的伏安特性在实验区间内应随电压单调递增：
    对预测电流关于电压求导后，把负的梯度作为惩罚项。
    """
    data_loss = F.mse_loss(pred, target)

    gradient = torch.autograd.grad(
        outputs=pred.sum(),
        inputs=voltage,
        create_graph=True,
    )[0]

    # 只惩罚「随电压升高而下降」的预测，不惩罚变化剧烈但方向正确的点
    monotonic_penalty = F.relu(-gradient).mean()

    return data_loss + LAMBDA * monotonic_penalty
```

### 自适应正则化

固定强度的正则化在训练前期会拖慢收敛、在后期又不足以抑制过拟合，因此用自适应策略让约束强度随训练进展调整：前期以拟合数据为主，后期逐步收紧约束以提升泛化能力。

```python
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode="min",
    factor=0.5,
    patience=10,
)
```

## 我的工作

- **实验数据清洗、特征工程与数据集构建**：处理异常点、按工况分组，构造针尖曲率、放电间隙等特征。
- **设计并实现融合物理约束的深度神经网络**，通过自适应正则化优化泛化能力。
- **参与模型验证与误差分析**，验证预测结果的物理一致性。

### 特征工程比换模型更有效

早期试过直接放大网络容量，收益很小。问题不在模型容量，而在输入特征的表达：针尖曲率与放电间隙对电流的影响不是线性的，直接喂原始数值会让网络花大量参数去拟合这个非线性关系。把曲率相关项显式构造出来之后，同样的网络结构误差明显下降。

```python
def build_features(frame: pd.DataFrame) -> pd.DataFrame:
    features = pd.DataFrame(index=frame.index)
    features["voltage"] = frame["voltage"]
    features["gap"] = frame["gap"]
    # 针尖曲率越小，局部场强越集中：显式给出这一非线性关系
    features["curvature_inverse"] = 1.0 / frame["tip_radius"]
    features["field_strength"] = frame["voltage"] / (frame["gap"] * frame["tip_radius"])
    return features
```

## 成果

- 放电电流预测 **RMSE 低至 0.1165mA**，预测精度较传统经验公式**提升超 40%**。
- 获**第十一届全国大学生物理实验竞赛（创新）国家级二等奖**。
- 为电晕放电特性研究提供了数据驱动的 AI 解决方案，方法可迁移到其他物理实验教学场景。

## 复盘

最大的收获是理解了「约束」的价值：物理约束不是给模型加负担，而是把已知的领域规律当作先验信息注入，等价于在高电压区这种数据稀缺、噪声大的地方帮模型缩小搜索空间。

误差分析也暴露出局限：模型在放电间隙极小、接近击穿阈值的样本上误差明显偏大。这类样本在实验中数量很少且难以重复，后续如果要做，需要专门针对边界工况补采数据，而不是继续调模型。
