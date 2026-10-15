import { ContactForm } from '@/components/contact/ContactForm'
import { CopyEmail } from '@/components/contact/CopyEmail'
import { SocialLinks } from '@/components/contact/SocialLinks'
import { Section } from '@/components/layout/Section'
import { useProfile } from '@/hooks/useProfile'

export function Contact() {
  const { phone, location } = useProfile()

  return (
    <Section id="contact" title="联系" description="项目合作、实习机会或技术讨论，都欢迎直接联系。">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-fg-subtle">邮箱</p>
            <CopyEmail />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-fg-subtle">电话</p>
            <a
              href={`tel:${phone}`}
              className="inline-flex min-h-11 items-center font-mono text-sm text-fg transition-colors duration-200 ease-standard hover:text-accent"
            >
              {phone}
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-fg-subtle">所在城市</p>
            <p className="text-fg">{location}</p>
          </div>

          <SocialLinks />

          <p className="text-sm text-fg-muted">
            表单提交后会直接发送到我的邮箱，我会尽快回复。也可以通过上面的邮箱直接联系我。
          </p>
        </div>

        <div className="rounded-card border border-border bg-surface p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </Section>
  )
}
