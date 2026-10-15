import { Section } from '@/components/layout/Section'
import { Reveal } from '@/components/ui/Reveal'
import { SkillBar } from '@/components/ui/SkillBar'
import { ToolIcon } from '@/components/ui/ToolIcon'
import { useSkillGroups } from '@/hooks/useSkillGroups'

export function Skills() {
  const skillGroups = useSkillGroups()

  return (
    <Section
      id="skills"
      title="技能"
      description="按方向分类，熟练度根据项目与竞赛经历推断，可随时调整。"
    >
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group, index) => (
          <li key={group.category} className="h-full">
            <Reveal className="h-full" delayMs={Math.min(index, 5) * 60}>
              <div className="flex h-full flex-col rounded-card border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-fg">{group.category}</h3>

                <ul className="mt-5 flex flex-col gap-5">
                  {group.items.map((skill) => (
                    <li key={skill.name} className="flex items-start gap-3">
                      <ToolIcon slug={skill.icon} className="mt-0.5" />
                      <div className="flex-1">
                        <SkillBar skill={skill} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  )
}
