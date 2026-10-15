import { Section } from '@/components/layout/Section'
import { Timeline } from '@/components/ui/Timeline'
import { useProfile } from '@/hooks/useProfile'

export function About() {
  const { bio, experience, awards } = useProfile()

  return (
    <Section id="about" title="关于我" description="教育背景、项目经历与荣誉奖项。">
      <div className="flex flex-col gap-14">
        <div className="flex max-w-3xl flex-col gap-4">
          {bio.map((paragraph) => (
            <p key={paragraph} className="text-fg-muted">
              {paragraph}
            </p>
          ))}
        </div>

        <div>
          <h3 className="mb-8 text-lg font-semibold text-fg">教育与项目经历</h3>
          <Timeline items={experience} />
        </div>

        <div>
          <h3 className="mb-6 text-lg font-semibold text-fg">荣誉奖项</h3>
          <div className="flex flex-col gap-8">
            {awards.map((group) => (
              <div key={group.level} className="flex flex-col gap-3">
                <p className="text-sm text-accent">{group.level}</p>
                <ul className="flex flex-col divide-y divide-border border-t border-border">
                  {group.items.map((item) => (
                    <li
                      key={item.name}
                      className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3"
                    >
                      <span className="text-sm text-fg">
                        {item.name}
                        {item.detail ? (
                          <span className="ml-2 text-fg-subtle">| {item.detail}</span>
                        ) : null}
                      </span>
                      {item.date ? (
                        <span className="font-mono text-xs text-fg-subtle">{item.date}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
