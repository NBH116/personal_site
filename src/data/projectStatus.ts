/**
 * 项目状态的文案映射。
 *
 * 单独成文件而不是写在页面里：这份文案同时出现在前台详情页、后台列表与后台表单的
 * 下拉项中，三处各写一遍必然会出现「开发中」与「进行中」混用这类不一致。
 * 类型独立声明（不 import `schemas/content.ts`）是为了让 `src/data` 与
 * `src/schemas` 之间保持单向依赖：数据文件不该被校验规则牵着走。
 */
export type ProjectStatus = 'active' | 'wip' | 'archived'

export const projectStatusLabels: Record<ProjectStatus, string> = {
  active: '进行中',
  wip: '开发中',
  archived: '已归档',
}

/** 列表筛选项与表单下拉项共用的顺序 */
export const projectStatusOrder: ProjectStatus[] = ['active', 'wip', 'archived']
