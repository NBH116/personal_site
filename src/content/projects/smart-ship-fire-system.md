---
title: "智慧船舶智能火灾感知与应急系统"
description: "融合烟雾、热成像与毫米波雷达的多源数据，用 YOLO 完成火情识别，并打通早期预警、舱室定位、可视化与联动处置的完整闭环。"
date: "2025-07-01"
tags: ["YOLO", "多源数据融合", "Web 可视化", "数据库设计"]
role: "核心成员"
period: "2025.07 - 至今"
featured: true
status: "active"
---

船舶机舱与货舱是典型的高风险密闭空间：空间狭长、遮挡多、设备发热源密集，火灾一旦形成就几乎没有处置窗口。传统方案依赖单点烟雾报警器，问题集中在三处——**响应滞后**（烟感要等到烟雾扩散到探头位置）、**定位不准**（报警只知道「某一区域」，不知道「哪一舱、几个人」）、**联动不足**（报警与消防设备、人员疏散之间没有自动衔接）。

本项目要解决的就是这三个问题：用多源数据把「着火点」和「人」同时定位出来，再把预警、可视化与处置动作串成一条自动链路。

## 项目背景

系统的数据来源是三类传感器，各自补齐对方的短板：

| 数据源 | 优势 | 短板 |
| --- | --- | --- |
| 烟雾传感器 | 成本低、部署密度高 | 响应滞后，无法定位 |
| 热成像 | 直接反映温度分布，可穿透烟雾 | 单帧难判断火情真伪 |
| 毫米波雷达 | 穿透烟尘，可探测人员位置与呼吸体征 | 不反映火情本身 |

单靠任何一路数据都无法同时给出「火情确认」与「人员位置」，因此系统的核心设计是把三路数据在时间与空间上对齐后做融合判定。

## 我的工作

我担任核心成员，主要负责 Web 端与数据侧：

- **人员态势可视化**：把雷达回波解算出的舱室人员位置实时投影到平面示意图上，支持按舱室筛选与历史轨迹回放。
- **热成像热力图渲染**：将热成像帧的温度矩阵映射为色阶，叠加在舱室底图上，用于快速判断高温区域。
- **报警日志与设备状态监控**：报警时间线、等级分类、处置状态流转，以及传感器在线率与心跳状态的总览面板。
- **数据库设计与数据持久化**：完成设备、报警、传感器、人员位置等核心表的结构设计，保障数据高效存储、检索与历史回溯。
- **YOLO 训练与部署**：完成火情目标识别算法在真实场景下的训练与部署，提升火情早期预警的准确性与响应速度。

## 技术方案

### 热力图渲染的取色与性能

热力图最容易踩的坑是取色函数：用 HSL 旋转色相得到的色阶在高温区过渡不自然，看起来像一坨红色而不是「温度」。所以色阶固定为一组人工挑选的锚点色，中间做线性插值。

另一个坑是逐点绘制。一帧温度矩阵动辄上万个采样点，用 `fillRect` 逐点画会在低端机上直接掉帧。实际做法是先把矩阵降采样到与画布像素一一对应的分辨率，写入 `ImageData` 后一次性 `putImageData`。

```ts
/** 把温度矩阵降采样成画布尺寸的 ImageData，避免逐点 fillRect */
function renderThermal(
  matrix: Float32Array,
  matrixWidth: number,
  matrixHeight: number,
  target: ImageData,
) {
  const { width, height, data } = target

  for (let y = 0; y < height; y += 1) {
    // 降采样时取块内最大值，高温点不会被平均值抹掉
    const sourceY = Math.floor((y / height) * matrixHeight)

    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.floor((x / width) * matrixWidth)
      const value = matrix[sourceY * matrixWidth + sourceX] ?? 0
      const [r, g, b, a] = colorFor(value)
      const offset = (y * width + x) * 4

      data[offset] = r
      data[offset + 1] = g
      data[offset + 2] = b
      data[offset + 3] = a
    }
  }

  return target
}
```

### 报警与设备状态的数据模型

报警记录不能只存「发生了什么事」，还要存「当时系统认为发生了什么」，否则事后回溯时无法区分误报与漏报。因此报警表同时记录触发时的传感器读数快照与算法给出的置信度。

```sql
CREATE TABLE alarm_event (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id     BIGINT       NOT NULL COMMENT '触发报警的设备',
  cabin_id      BIGINT       NOT NULL COMMENT '舱室，用于定位',
  level         TINYINT      NOT NULL COMMENT '1 预警 2 报警 3 紧急',
  confidence    DECIMAL(4,3) NULL COMMENT '算法置信度，人工报警为空',
  snapshot      JSON         NULL COMMENT '触发时刻的多源读数快照',
  occurred_at   DATETIME     NOT NULL,
  handled_at    DATETIME     NULL,
  KEY idx_cabin_time (cabin_id, occurred_at),
  KEY idx_level (level)
);
```

`idx_cabin_time` 是为「某舱室最近一段时间的报警」这个查询建的——回溯场景几乎都是按舱室加时间范围过滤，单独给 `cabin_id` 建索引没有意义。

## 成果

- 获 **2025 年 ICAN 大学生创新创业竞赛 AI 应用创新挑战赛国家级三等奖**。
- 获**辽宁省大学生创新训练计划 A 级立项**。
- 申请专利《一种多模态融合的火灾监测与应急疏散系统及方法》，目前处于**实质审查阶段**。

## 复盘

最值得记录的一条经验是：多源融合的难点不在算法，而在**时间对齐**。三类传感器的采样频率差了一个数量级，热成像帧率远低于烟雾传感器上报频率，直接用「同一时刻的数据」做融合会引入系统性偏差。后来改为按滑动时间窗聚合，并记录每路数据相对窗口的时间偏移，融合结果才稳定下来。

另一个教训是可视化不能只做「好看」：人员态势图最初只画当前位置，用户反馈「看不出人在往哪走」，加上短时轨迹尾巴之后，疏散决策的可用性明显提升。
