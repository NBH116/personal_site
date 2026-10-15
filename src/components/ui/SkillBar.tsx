import { skillLevelLabel, type SkillItem } from '@/data/skills'
import { cx } from '@/lib/cx'

interface SkillBarProps {
  skill: SkillItem
}

const SEGMENTS = [1, 2, 3, 4, 5] as const

export function SkillBar({ skill }: SkillBarProps) {
  const label = skillLevelLabel(skill.level)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-fg">{skill.name}</span>
        <span className="text-xs text-fg-subtle">{label}</span>
      </div>

      {/*
        熟练度同时用段数与文字表达：只用颜色传达信息不满足无障碍要求，
        所以这里既给出 role="img" 的完整描述，也把级别文字渲染出来。
      */}
      <div
        role="img"
        aria-label={`${skill.name}，熟练度 ${skill.level} 分（满分 5 分，${label}）`}
        className="flex gap-1"
      >
        {SEGMENTS.map((segment) => (
          <span
            key={segment}
            className={cx(
              'h-1.5 flex-1 rounded-full',
              segment <= skill.level ? 'bg-accent' : 'bg-border-strong',
            )}
          />
        ))}
      </div>
    </div>
  )
}
