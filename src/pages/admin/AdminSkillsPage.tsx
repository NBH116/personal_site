import { Plus, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import {
  deleteSkillGroup,
  isSkillGroupOverridden,
  listHiddenSkillGroups,
  listSkillGroups,
  resetSkills,
  restoreSkillGroup,
  saveSkillGroup,
} from '@/api'
import type { SkillGroup } from '@/data/skills'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { FormStatus, type FormStatusKind } from '@/components/admin/FormStatus'
import { SkillGroupCard } from '@/components/admin/skills/SkillGroupCard'
import { Button } from '@/components/ui/Button'
import { useApiValue } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/**
 * 技能管理。
 *
 * 每个分类是一张独立的卡片，各自持有草稿、各自保存（原因写在 `SkillGroupCard`）。
 * 页面这一层的职责只有三件事：把分类名当主键处理重命名、维护隐藏分类的恢复入口、
 * 以及给「保存 / 删除 / 恢复」这类跨卡片的结果提供一处统一的反馈。
 */

/**
 * 新增分类先落一个占位名，而不是先在内存里建一张未保存的卡片。
 *
 * 取舍：占位名会立刻出现在前台的技能区块里，直到被改掉。换来的好处是「已保存」
 * 只有一种状态 —— 内存里不再存在「这条到底写了没有」的分支，删除与恢复也就
 * 不需要区分两种卡片。分类名允许重复，所以这里要自己找一个没用过的名字。
 */
function nextPlaceholderCategory(existing: string[]): string {
  const base = '新分类'
  const taken = new Set(existing)

  if (!taken.has(base)) return base

  let index = 2
  while (taken.has(`${base} ${index}`)) index += 1
  return `${base} ${index}`
}

export function AdminSkillsPage() {
  const groups = useApiValue(listSkillGroups)
  const hiddenGroups = useApiValue(listHiddenSkillGroups)

  const [status, setStatus] = useState<FormStatusKind>('idle')
  const [message, setMessage] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  useDocumentTitle('技能管理')

  const report = (next: FormStatusKind, text: string) => {
    setStatus(next)
    setMessage(text)
  }

  function handleAdd() {
    const category = nextPlaceholderCategory(groups.map((group) => group.category))
    saveSkillGroup({ category, items: [{ name: '新技能', level: 3, icon: '' }] })

    report('success', `已新增「${category}」，改好名字与内容后点该卡片的「保存分类」。`)
  }

  /** 分类名同时是存储主键，重命名等于「删掉旧记录 + 写一条新记录」，必须成对执行 */
  function handleSave(previousCategory: string, next: SkillGroup) {
    if (previousCategory !== next.category) {
      deleteSkillGroup(previousCategory)
    }

    saveSkillGroup(next)
    report('success', `已保存「${next.category}」。`)
  }

  function handleDelete(category: string) {
    deleteSkillGroup(category)
    report('success', `已删除「${category}」。如果是仓库里的默认分类，它留在了下方「已隐藏」里。`)
  }

  function handleRestore(category: string) {
    restoreSkillGroup(category)
    report('success', `已恢复「${category}」的仓库默认内容。`)
  }

  function handleReset() {
    resetSkills()
    setConfirmReset(false)
    report('success', '已恢复仓库里的全部默认技能分类。')
  }

  return (
    <>
      <AdminPageHeader
        title="技能管理"
        description="每个分类单独保存。分类名是存储主键，改名字等于换一条记录，前台的技能区块会立刻跟着变。"
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={16} aria-hidden="true" />
              恢复默认
            </Button>
            <Button type="button" onClick={handleAdd}>
              <Plus size={16} aria-hidden="true" />
              新增分类
            </Button>
          </>
        }
      >
        <FormStatus status={status} message={message} />
      </AdminPageHeader>

      {groups.length === 0 ? (
        <p className="rounded-card border border-dashed border-border px-6 py-14 text-center text-sm text-fg-muted">
          当前没有任何技能分类，前台的技能区块会整块隐藏。点「新增分类」或从下方恢复默认分类。
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <SkillGroupCard
              key={group.category}
              group={group}
              overridden={isSkillGroupOverridden(group.category)}
              onSave={(next) => handleSave(group.category, next)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {hiddenGroups.length > 0 ? (
        <section
          aria-labelledby="hidden-skills"
          className="mt-8 rounded-card border border-border bg-surface p-5 sm:p-6"
        >
          <h2 id="hidden-skills" className="text-base font-semibold text-fg">
            已隐藏的仓库分类
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            这些分类还在 <code className="font-mono">src/data/skills.ts</code> 里，只是被从站点上
            隐藏了。恢复会回到仓库里的原始内容，你改过的版本不会保留。
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {hiddenGroups.map((group) => (
              <li
                key={group.category}
                className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-border bg-bg px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-fg">{group.category}</p>
                  <p className="mt-0.5 text-xs text-fg-subtle">
                    {group.items.length} 项技能 · {group.items.map((item) => item.name).join('、')}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRestore(group.category)}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  恢复
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirmReset}
        title="恢复全部默认技能分类？"
        description="这会丢弃你在本页做过的全部改动，包括新增的分类、改过的熟练度与删除记录，恢复成 src/data/skills.ts 里的原始内容。此操作不可撤销。"
        confirmLabel="恢复默认"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  )
}
