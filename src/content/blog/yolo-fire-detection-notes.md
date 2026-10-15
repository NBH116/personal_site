---
title: "在船舶火情识别里落地 YOLO：数据、阈值与部署"
description: "把 YOLO 放进真实火情识别场景时，真正花时间的不是模型选型，而是标注口径、置信度阈值和误报代价的权衡。"
date: "2025-09-12"
tags: ["YOLO", "目标检测", "工程实践"]
---

> 这是参与省级创新训练项目《智慧船舶智能火灾感知与应急系统》期间的工作笔记，记录 YOLO 从实验环境走到项目环境时遇到的几个问题。

## 模型不是最难的部分

在公开数据集上跑通 YOLO 只需要一个下午。真正消耗时间的是三件事：**标注口径不统一**、**置信度阈值该定多少**、以及**误报的代价谁承担**。这三件事都不在模型的范畴里，却直接决定系统能不能用。

## 标注口径：什么算「火」

火情目标的边界是所有标注问题的根源。火焰边缘在热成像里是渐变的，不同标注者对「火的范围」理解不一致，同一张图标注出来的框大小能差一倍。如果放任这种差异，模型学到的是标注者的个人习惯，而不是火焰本身。

我们的做法是先固化一份标注规范，明确三件事：

- 框的边界以**可见明火**为准，不含纯高温但无火焰的区域；
- 火光反射（例如金属壁面上的反光）单独标记为干扰类，不倒推成火情；
- 火焰被结构遮挡时，只标可见部分，不做外推补全。

规范定完之后，标注一致性才稳定下来。

## 置信度阈值：误报与漏报不对称

火情检测里两类错误的代价完全不对称：漏报可能意味着一次事故，误报只是打扰船员。所以不能取「F1 最大」的那个阈值。

实用做法是先确定一个可接受的误报率上限（例如每小时不超过一次），再在这个约束下取召回率最高的阈值。

```ts
/** 在误报率约束下取召回率最高的阈值，而不是取 F1 最大点 */
function pickThreshold(
  scores: { score: number; isFire: boolean }[],
  maxFalseAlarmPerHour: number,
  samplesPerHour: number,
): number {
  const candidates = [...new Set(scores.map((item) => item.score))].sort((a, b) => b - a)
  const allowed = maxFalseAlarmPerHour / samplesPerHour

  let best = candidates[0] ?? 0.5
  let bestRecall = -1

  for (const threshold of candidates) {
    const positives = scores.filter((item) => item.score >= threshold)
    const falseAlarmRate = positives.filter((item) => !item.isFire).length / samplesPerHour

    if (falseAlarmRate > allowed) continue

    const recall = positives.filter((item) => item.isFire).length / scores.filter((i) => i.isFire).length
    if (recall > bestRecall) {
      bestRecall = recall
      best = threshold
    }
  }

  return best
}
```

这个函数有个隐含前提：误报率的统计口径必须和线上一致（按小时、按摄像头通道），否则离线算出来的阈值到线上会偏。

## 单帧判定不够：要引入时序确认

单帧检测最大的问题是瞬时干扰——焊接火花、反光、镜头脏污都可能在一帧里看起来像火。把单帧结果直接接到报警链路上，误报会多到船员直接关掉报警。

实际方案是加一层时序确认：**连续 N 帧命中同一区域**才升级为报警。

```python
def confirm_over_frames(detections: list[list[Box]], required: int = 5) -> list[Box]:
    """连续 required 帧命中同一空间区域的检测才认定为火情。

    用 IOU 做跨帧关联，避免把镜头轻微抖动当成新目标。
    """
    confirmed: list[Box] = []
    trackers: list[dict] = []

    for frame_boxes in detections:
        for box in frame_boxes:
            matched = next(
                (t for t in trackers if iou(t["box"], box) > 0.5),
                None,
            )
            if matched is None:
                trackers.append({"box": box, "hits": 1})
                continue

            matched["box"] = box
            matched["hits"] += 1

            if matched["hits"] == required:
                confirmed.append(box)

    return confirmed
```

`required` 的取值直接决定响应速度：取值越大误报越少，但确认延迟越长。我们的场景下火情扩散速度对秒级差异不敏感，所以宁可多确认几帧。

## 部署侧的三个坑

| 坑 | 现象 | 处理方式 |
| --- | --- | --- |
| 输入尺寸不一致 | 线上推理结果明显差于离线评估 | 固定预处理尺寸与归一化方式，训练与推理共用同一份预处理代码 |
| 后处理重复 | 同一目标在相邻帧被反复上报 | 上报前做跨帧去重，只在状态变化时推事件 |
| 显存缓慢增长 | 长时间运行后 OOM | 逐步验证为推理会话未复用，改为单例加载模型 |

第三条最难排查，因为它在短时间压测里完全不出现，只有连续跑若干小时才暴露。

## 小结

如果重做一遍，我会把顺序调整成：**先定标注规范 → 再定阈值口径 → 最后选模型**。我们最初是先选模型后补规范，导致早期的标注数据大部分需要返工。模型的选择在这个项目里从来不是瓶颈。
