---
title: "物理约束神经网络：把电晕放电电流预测的 RMSE 压到 0.1165mA"
description: "当数据在高电压区噪声很大时，纯数据驱动的模型会拟合噪声。把物理规律写进损失函数，反而换来了更好的泛化能力。"
date: "2025-08-15"
tags: ["深度学习", "PyTorch", "物理实验"]
updated: "2025-09-01"
---

> 来自《基于 AI 技术下电晕放电伏安特性的探究》的工作笔记。项目获第十一届全国大学生物理实验竞赛（创新）国家级二等奖。

## 问题出在高电压区

实验平台采集的是针-板电极在不同针尖曲率、不同放电间隙下的伏安特性数据。低电压区数据平稳，传统经验公式拟合得不错；到了高电压区，放电过程的随机性让电流数据波动明显变大，经验公式的精度就撑不住了。

这正是数据驱动方法的机会，但也是它的陷阱：**噪声大的地方，纯拟合模型会认真学习噪声**。

## 一个直观的失败案例

最早用纯 MSE 损失训练的全连接网络，在测试集上出现了一些物理上不可能的结果：电压升高，预测电流反而下降。

这不是模型不稳定，而是目标函数的必然结果——MSE 只关心「拟合数据点」，不关心曲线的形状是否合理。只要某个电压点的实测值偏低（放电随机性导致的离群点），模型就会向它靠拢。

## 把物理规律写进损失函数

解决办法是在损失里加一项物理约束：在实验区间内，电晕放电的伏安特性应随电压单调递增。对这一点的偏离要付出代价。

```python
import torch
import torch.nn.functional as F

LAMBDA = 0.1

def physics_constrained_loss(
    pred: torch.Tensor,
    target: torch.Tensor,
    voltage: torch.Tensor,
) -> torch.Tensor:
    """数据拟合项 + 单调性物理约束项。

    pred 必须由 voltage 经模型计算得到且参与计算图，
    否则 autograd.grad 拿不到梯度。
    """
    data_loss = F.mse_loss(pred, target)

    gradient = torch.autograd.grad(
        outputs=pred.sum(),
        inputs=voltage,
        create_graph=True,
    )[0]

    # 只惩罚「随电压升高而下降」的预测
    monotonic_penalty = F.relu(-gradient).mean()

    return data_loss + LAMBDA * monotonic_penalty
```

`create_graph=True` 不能省：加了它才能把约束项也纳入反向传播，让模型真正「学会」单调性。少了它，约束只影响损失数值而不影响梯度，等于没有。

## 特征工程比加容量有效

在加约束之前，我先试过放大网络容量，收益很小。真正带来明显改进的是输入特征。

原因在于针尖曲率与放电间隙对电流的影响不是线性的。把原始数值直接喂给网络，等于要求网络用参数去近似一个已知的物理关系。显式构造出来之后，同样规模的网络误差就降下来了。

```python
def build_features(frame):
    import pandas as pd

    features = pd.DataFrame(index=frame.index)
    features["voltage"] = frame["voltage"]
    features["gap"] = frame["gap"]
    # 曲率越大，局部场强越集中，与电流正相关
    features["curvature"] = 1.0 / frame["tip_radius"]
    features["field_strength"] = frame["voltage"] / (frame["gap"] * frame["tip_radius"])
    return features
```

## 自适应正则化

约束强度 `LAMBDA` 是固定的，但训练的不同阶段对它的需求不同：前期需要它够弱，让模型先把数据拟合起来；后期需要它够强，抑制过拟合。因此用学习率调度配合阶段性的强度调整，而不是全程一个值。

```python
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
    optimizer,
    mode="min",
    factor=0.5,   # 验证损失停滞时学习率减半
    patience=10,
)
```

## 结果

- 放电电流预测 **RMSE 低至 0.1165mA**；
- 预测精度较传统经验公式**提升超 40%**；
- 验证集上未再出现违背单调性的预测。

## 三点经验

**一、约束是缩小搜索空间，不是增加负担。** 物理规律是免费的先验信息，把它写进损失等价于提前告诉模型「答案长什么样」，在数据噪声大、样本稀缺的区域收益最明显。

**二、先检查特征，再调模型。** 我在这上面浪费了大约一周：反复调整网络结构，而问题一直在输入特征里。

**三、模型误差的分布比平均值更有信息量。** 平均 RMSE 很好看，但误差集中在接近击穿阈值的少数样本上。这类边界工况在实验里数量很少、重复性差，靠调模型解决不了，只能补采数据。

## 遗留问题

接近击穿阈值时误差明显偏大。推测是因为该区间样本量过少，且实验重复性本身较差——同一组参数重复测量得到的电流值离散度就很高。后续如果继续做，方向是专门针对边界工况设计实验，而不是继续在网络结构上找提升。
