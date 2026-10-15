import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { appendItem, moveItem, removeItem, replaceItem } from '@/lib/list'
import type { ProfileValues } from '@/schemas/admin'

import { TextField } from '../Field'
import { RepeaterCard } from '../RepeaterCard'

type AwardGroups = ProfileValues['awards']
type AwardItems = AwardGroups[number]['items']

interface AwardsEditorProps {
  groups: AwardGroups
  onChange: (groups: AwardGroups) => void
}

/**
 * 荣誉奖项编辑器：分组（国家级 / 省级 / 市校级）+ 组内条目。
 *
 * 组内条目的 key 用下标：奖项没有 id，名称又允许重复（同一名称可以在不同级别出现），
 * 用名称当 key 会产生重复 key。条目顺序由用户控制，因此下标足够稳定。
 */
export function AwardsEditor({ groups, onChange }: AwardsEditorProps) {
  const addGroup = () => {
    onChange(appendItem(groups, { level: '', items: [] }))
  }

  const updateGroup = (index: number, patch: Partial<AwardGroups[number]>) => {
    const group = groups[index]
    if (!group) return
    onChange(replaceItem(groups, index, { ...group, ...patch }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-fg-subtle">
          日期格式形如 <code className="font-mono">2025.06</code>，可以留空。
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={addGroup}>
          <Plus size={14} aria-hidden="true" />
          新增组
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-card border border-dashed border-border px-4 py-6 text-center text-sm text-fg-subtle">
          还没有奖项分组
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {groups.map((group, groupIndex) => (
            <RepeaterCard
              key={groupIndex}
              index={groupIndex}
              total={groups.length}
              title={group.level || `奖项组 ${groupIndex + 1}`}
              onMove={(from, to) => onChange(moveItem(groups, from, to))}
              onRemove={(target) => onChange(removeItem(groups, target))}
            >
              <TextField
                id={`award-level-${groupIndex}`}
                label="级别"
                value={group.level}
                placeholder="国家级 / 省级 / 市校级"
                onChange={(value) => updateGroup(groupIndex, { level: value })}
              />

              <AwardItemsEditor
                items={group.items}
                onChange={(items) => updateGroup(groupIndex, { items })}
                idPrefix={`award-${groupIndex}`}
              />
            </RepeaterCard>
          ))}
        </ul>
      )}
    </div>
  )
}

interface AwardItemsEditorProps {
  items: AwardItems
  onChange: (items: AwardItems) => void
  idPrefix: string
}

function AwardItemsEditor({ items, onChange, idPrefix }: AwardItemsEditorProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg">奖项条目</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange(appendItem(items, { name: '', detail: '', date: '' }))}
        >
          <Plus size={14} aria-hidden="true" />
          新增奖项
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-fg-subtle">这一组还没有条目。</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <RepeaterCard
              key={index}
              index={index}
              total={items.length}
              title={item.name || `奖项 ${index + 1}（未命名）`}
              onMove={(from, to) => onChange(moveItem(items, from, to))}
              onRemove={(target) => onChange(removeItem(items, target))}
            >
              <TextField
                id={`${idPrefix}-name-${index}`}
                label="奖项名称"
                value={item.name}
                onChange={(value) =>
                  onChange(replaceItem(items, index, { ...item, name: value }))
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id={`${idPrefix}-detail-${index}`}
                  label="说明"
                  value={item.detail}
                  placeholder="核心成员 / 负责人"
                  onChange={(value) =>
                    onChange(replaceItem(items, index, { ...item, detail: value }))
                  }
                />
                <TextField
                  id={`${idPrefix}-date-${index}`}
                  label="日期"
                  value={item.date}
                  placeholder="2025.06"
                  onChange={(value) =>
                    onChange(replaceItem(items, index, { ...item, date: value }))
                  }
                />
              </div>
            </RepeaterCard>
          ))}
        </ul>
      )}
    </div>
  )
}
