import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { skillLevelLabels, type SkillGroup, type SkillItem } from '@/data/skills'
import { appendItem, moveItem, removeItem, replaceItem } from '@/lib/list'
import { firstFieldErrors, skillGroupSchema, skillLevelSchema } from '@/schemas/admin'

import { ConfirmDialog } from '../ConfirmDialog'
import { FieldFrame, SelectField, TextField } from '../Field'
import { FormStatus, type FormStatusKind } from '../FormStatus'
import { RepeaterCard } from '../RepeaterCard'

const LEVEL_OPTIONS = Object.entries(skillLevelLabels).map(([level, label]) => ({
  value: level,
  label: `${level} · ${label}`,
}))

function toSkillLevel(value: string, fallback: SkillItem['level']): SkillItem['level'] {
  const parsed = skillLevelSchema.safeParse(Number(value))
  return parsed.success ? parsed.data : fallback
}

interface SkillGroupCardProps {
  group: SkillGroup
  /** 该分类是否被后台改动过 */
  overridden: boolean
  onSave: (group: SkillGroup) => void
  onDelete: (category: string) => void
}

/**
 * 单个技能分类的编辑卡片。
 *
 * 每个分类各自持有本地草稿并单独保存：分类之间互不依赖，让整页共用一个「保存」
 * 会把一处的笔误变成其他分类的阻塞项。
 *
 * 重命名分类等于换主键（数据层用分类名做主键），所以保存时页面上会先按旧名删除记录。
 * 组件本身不知道这件事，只把新值交出去。
 *
 * 草稿与外部数据同步依赖父级的 `key`：删除或恢复后父级会换 key 重建这个组件，
 * 因此不需要再写一个 `useEffect` 去监听 `group` 的引用变化。
 */
export function SkillGroupCard({ group, overridden, onSave, onDelete }: SkillGroupCardProps) {
  const [draft, setDraft] = useState<SkillGroup>(group)
  const [categoryError, setCategoryError] = useState('')
  const [itemsError, setItemsError] = useState('')
  const [status, setStatus] = useState<FormStatusKind>('idle')
  const [message, setMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const update = (next: SkillGroup) => {
    setDraft(next)
    // 改动之后旧的「已保存」提示不再成立，清掉避免误导
    setStatus('idle')
    setMessage('')
  }

  const handleSave = () => {
    const parsed = skillGroupSchema.safeParse(draft)

    if (!parsed.success) {
      const fieldErrors = firstFieldErrors<'category' | 'items'>(parsed.error)
      setCategoryError(fieldErrors.category ?? '')
      setItemsError(fieldErrors.items ?? '')
      setStatus('error')
      setMessage(parsed.error.issues[0]?.message ?? '有字段没有通过校验。')
      return
    }

    setCategoryError('')
    setItemsError('')
    onSave(parsed.data)
    setStatus('success')
    setMessage('已保存。')
  }

  return (
    <section
      aria-label={`技能分类：${group.category}`}
      className="rounded-card border border-border bg-surface p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <TextField
          id={`skill-category-${group.category}`}
          label="分类名"
          value={draft.category}
          error={categoryError}
          hint={overridden ? '该分类已被修改' : undefined}
          className="min-w-56 flex-1"
          onChange={(value) => update({ ...draft, category: value })}
        />

        <div className="flex flex-wrap gap-2 pt-6">
          <Button type="button" onClick={handleSave}>
            <Save size={16} aria-hidden="true" />
            保存分类
          </Button>
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} aria-hidden="true" />
            删除分类
          </Button>
        </div>
      </div>

      <FieldFrame id={`skill-items-${group.category}`} label="技能条目" error={itemsError}>
        <div className="flex flex-col gap-3">
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                update({
                  ...draft,
                  items: appendItem(draft.items, { name: '', level: 3, icon: '' }),
                })
              }
            >
              <Plus size={14} aria-hidden="true" />
              新增技能
            </Button>
          </div>

          {draft.items.length === 0 ? (
            <p className="rounded-card border border-dashed border-border px-4 py-6 text-center text-sm text-fg-subtle">
              至少保留一项技能
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {draft.items.map((item, index) => (
                <RepeaterCard
                  key={index}
                  index={index}
                  total={draft.items.length}
                  title={item.name || `技能 ${index + 1}（未命名）`}
                  onMove={(from, to) =>
                    update({ ...draft, items: moveItem(draft.items, from, to) })
                  }
                  onRemove={(target) =>
                    update({ ...draft, items: removeItem(draft.items, target) })
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <TextField
                      id={`skill-name-${group.category}-${index}`}
                      label="名称"
                      value={item.name}
                      onChange={(value) =>
                        update({
                          ...draft,
                          items: replaceItem(draft.items, index, { ...item, name: value }),
                        })
                      }
                    />
                    <SelectField
                      id={`skill-level-${group.category}-${index}`}
                      label="熟练度"
                      value={String(item.level)}
                      options={LEVEL_OPTIONS}
                      onChange={(value) =>
                        update({
                          ...draft,
                          items: replaceItem(draft.items, index, {
                            ...item,
                            level: toSkillLevel(value, item.level),
                          }),
                        })
                      }
                    />
                    <TextField
                      id={`skill-icon-${group.category}-${index}`}
                      label="图标 slug"
                      value={item.icon}
                      placeholder="react"
                      onChange={(value) =>
                        update({
                          ...draft,
                          items: replaceItem(draft.items, index, { ...item, icon: value }),
                        })
                      }
                    />
                  </div>
                </RepeaterCard>
              ))}
            </ul>
          )}
        </div>
      </FieldFrame>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <FormStatus status={status} message={message} />

        <button
          type="button"
          onClick={() => {
            setDraft(group)
            setCategoryError('')
            setItemsError('')
            setStatus('idle')
            setMessage('')
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-fg"
        >
          <RotateCcw size={14} aria-hidden="true" />
          撤销未保存的修改
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`删除技能分类「${group.category}」？`}
        description="该分类及其下的全部技能条目都会从技能区块消失。如果它是仓库里的默认分类，删除会被记为「已隐藏」，之后可以恢复。"
        confirmLabel="确认删除"
        onConfirm={() => {
          setConfirmDelete(false)
          onDelete(group.category)
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </section>
  )
}
