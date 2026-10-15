import { useState } from 'react'

import { ButtonLink } from '@/components/ui/Button'
import { useProfile } from '@/hooks/useProfile'
import type { Profile } from '@/api/types'

const FACTS = [
  { label: '加权综合排名', value: '6 / 25' },
  { label: '平均学分绩点', value: '3.80 / 5.00' },
  { label: '英语水平', value: 'CET-6（465）' },
]

function Avatar({ profile }: { profile: Profile }) {
  const [failed, setFailed] = useState(false)

  // 头像缺失或加载失败时回退为首字母占位块，不出现破图（PRD 3.2 异常态）
  if (!profile.avatar || failed) {
    return (
      <div
        aria-hidden="true"
        className="flex size-20 shrink-0 items-center justify-center rounded-full border border-border bg-accent-soft text-2xl font-semibold text-accent sm:size-28 sm:text-3xl"
      >
        {profile.name.slice(0, 1)}
      </div>
    )
  }

  return (
    <img
      src={profile.avatar}
      alt={`${profile.name} 的头像`}
      width={112}
      height={112}
      onError={() => setFailed(true)}
      className="size-20 shrink-0 rounded-full border border-border object-cover sm:size-28"
    />
  )
}

export function Hero() {
  const profile = useProfile()

  return (
    <section id="hero" className="scroll-mt-16 pt-8 pb-10 md:scroll-mt-20 md:pt-20 md:pb-24">
      <div className="mx-auto w-full max-w-content px-gutter sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-12">
          <Avatar profile={profile} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
                {profile.name}
              </h1>
              <p className="text-base text-accent sm:text-lg">
                {profile.org} · {profile.role}
              </p>
            </div>

            <p className="max-w-2xl text-fg-muted">{profile.tagline}</p>

            <p className="text-sm text-fg-subtle">{profile.location}</p>

            <div className="mt-2 flex flex-wrap gap-3">
              <ButtonLink href="#projects">看项目</ButtonLink>
              {profile.resumeUrl ? (
                <ButtonLink href={profile.resumeUrl} variant="secondary" download>
                  下载简历
                </ButtonLink>
              ) : null}
              <ButtonLink href="#contact" variant="ghost">
                联系我
              </ButtonLink>
            </div>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6 sm:mt-12 sm:gap-6 sm:pt-8">
          {FACTS.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-1">
              <dt className="text-xs text-fg-subtle">{fact.label}</dt>
              <dd className="font-mono text-sm text-fg sm:text-base">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
