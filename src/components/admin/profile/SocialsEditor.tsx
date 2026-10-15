import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { appendItem, moveItem, removeItem, replaceItem } from '@/lib/list'
import type { ProfileValues } from '@/schemas/admin'

import { TextField } from '../Field'
import { RepeaterCard } from '../RepeaterCard'

type Socials = ProfileValues['socials']

interface SocialsEditorProps {
  items: Socials
  onChange: (items: Socials) => void
}

/**
 * 社交链接编辑器。
 * `icon` 填 simple-icons 的 slug（如 `github`），找不到图标时前台会退化成首字母方块。
 */
export function SocialsEditor({ items, onChange }: SocialsEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-fg-subtle">
          图标名用 simple-icons 的 slug，例如 <code className="font-mono">github</code>、
          <code className="font-mono">zhihu</code>。留空时前台显示首字母方块。
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange(appendItem(items, { label: '', url: '', icon: '' }))}
        >
          <Plus size={14} aria-hidden="true" />
          新增链接
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-border px-4 py-6 text-center text-sm text-fg-subtle">
          还没有社交链接，前台对应区域会自动隐藏。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <RepeaterCard
              key={index}
              index={index}
              total={items.length}
              title={item.label || `链接 ${index + 1}（未命名）`}
              onMove={(from, to) => onChange(moveItem(items, from, to))}
              onRemove={(target) => onChange(removeItem(items, target))}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField
                  id={`social-label-${index}`}
                  label="名称"
                  value={item.label}
                  placeholder="GitHub"
                  onChange={(value) =>
                    onChange(replaceItem(items, index, { ...item, label: value }))
                  }
                />
                <TextField
                  id={`social-url-${index}`}
                  label="链接"
                  type="url"
                  value={item.url}
                  placeholder="https://github.com/xxx"
                  className="sm:col-span-2"
                  onChange={(value) => onChange(replaceItem(items, index, { ...item, url: value }))}
                />
              </div>

              <TextField
                id={`social-icon-${index}`}
                label="图标 slug"
                value={item.icon}
                placeholder="github"
                onChange={(value) => onChange(replaceItem(items, index, { ...item, icon: value }))}
              />
            </RepeaterCard>
          ))}
        </ul>
      )}
    </div>
  )
}
