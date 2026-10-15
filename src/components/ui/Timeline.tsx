import type { ExperienceItem } from '@/data/experience'
import { cx } from '@/lib/cx'

interface TimelineProps {
  items: ExperienceItem[]
}

const TYPE_LABELS: Record<ExperienceItem['type'], string> = {
  education: '教育背景',
  project: '项目经历',
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="relative flex flex-col gap-10">
      {items.map((item) => (
        <li key={item.id} className="relative pl-6 sm:pl-8">
          {/* 轴线：移动端也保留，靠左对齐即可，不额外做响应式分支 */}
          <span aria-hidden="true" className="absolute top-2 left-0 h-full w-px bg-border" />
          <span
            aria-hidden="true"
            className={cx(
              'absolute top-1.5 left-[-3px] size-2 rounded-full',
              item.type === 'education' ? 'bg-accent-strong' : 'bg-accent',
            )}
          />

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-xs text-fg-subtle">{item.period}</span>
              <span className="text-xs text-fg-muted">{TYPE_LABELS[item.type]}</span>
            </div>

            <h3 className="text-base font-semibold text-fg">{item.title}</h3>
            <p className="text-sm text-fg-muted">{item.org}</p>
            <p className="mt-2 text-sm text-fg-muted">{item.description}</p>

            {item.highlights && item.highlights.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1">
                {item.highlights.map((highlight) => (
                  <li key={highlight} className="text-sm text-fg-muted">
                    <span aria-hidden="true" className="mr-2 text-accent">
                      ·
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
