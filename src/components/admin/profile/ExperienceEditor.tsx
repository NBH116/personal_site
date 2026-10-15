import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { createId } from '@/lib/id'
import { appendItem, moveItem, removeItem, replaceItem } from '@/lib/list'
import type { ProfileValues } from '@/schemas/admin'

import { SelectField, TextAreaField, TextField } from '../Field'
import { RepeaterCard } from '../RepeaterCard'
import { StringListEditor } from '../StringListEditor'

type ExperienceItems = ProfileValues['experience']

const TYPE_OPTIONS = [
  { value: 'project', label: '项目经历' },
  { value: 'education', label: '教育背景' },
]

interface ExperienceEditorProps {
  items: ExperienceItems
  onChange: (items: ExperienceItems) => void
}

/**
 * 经历时间线编辑器。
 *
 * 「顺序」在这里有语义：前台时间线按数组顺序渲染，所以提供了上移/下移，
 * 而不是按日期自动排序（简历里存在「至今」这类无法参与排序的时间段）。
 */
export function ExperienceEditor({ items, onChange }: ExperienceEditorProps) {
  const add = () => {
    onChange(
      appendItem(items, {
        id: createId('exp'),
        period: '',
        title: '',
        org: '',
        description: '',
        type: 'project',
        highlights: [],
      }),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-fg-subtle">按前台展示顺序排列，可上下移动。</p>
        <Button type="button" size="sm" variant="secondary" onClick={add}>
          <Plus size={14} aria-hidden="true" />
          新增经历
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-border px-4 py-6 text-center text-sm text-fg-subtle">
          还没有经历条目
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item, index) => (
            <RepeaterCard
              key={item.id}
              index={index}
              total={items.length}
              title={item.title || `经历 ${index + 1}（未命名）`}
              onMove={(from, to) => onChange(moveItem(items, from, to))}
              onRemove={(target) => onChange(removeItem(items, target))}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  id={`experience-period-${item.id}`}
                  label="时间段"
                  value={item.period}
                  placeholder="2025.07 - 至今"
                  onChange={(value) => onChange(replaceItem(items, index, { ...item, period: value }))}
                />
                <SelectField
                  id={`experience-type-${item.id}`}
                  label="类型"
                  value={item.type}
                  options={TYPE_OPTIONS}
                  onChange={(value) =>
                    onChange(
                      replaceItem(items, index, {
                        ...item,
                        type: value === 'education' ? 'education' : 'project',
                      }),
                    )
                  }
                />
                <TextField
                  id={`experience-title-${item.id}`}
                  label="名称"
                  value={item.title}
                  onChange={(value) => onChange(replaceItem(items, index, { ...item, title: value }))}
                />
                <TextField
                  id={`experience-org-${item.id}`}
                  label="组织 / 角色"
                  value={item.org}
                  placeholder="省级创新训练项目 · 核心成员"
                  onChange={(value) => onChange(replaceItem(items, index, { ...item, org: value }))}
                />
              </div>

              <TextAreaField
                id={`experience-description-${item.id}`}
                label="描述"
                rows={4}
                value={item.description}
                onChange={(value) =>
                  onChange(replaceItem(items, index, { ...item, description: value }))
                }
              />

              <StringListEditor
                id={`experience-highlights-${item.id}`}
                label="要点"
                addLabel="新增要点"
                placeholder="一条具体的产出或成果"
                items={item.highlights}
                onChange={(highlights) => onChange(replaceItem(items, index, { ...item, highlights }))}
              />
            </RepeaterCard>
          ))}
        </ul>
      )}
    </div>
  )
}
