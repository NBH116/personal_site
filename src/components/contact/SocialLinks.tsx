import { useProfile } from '@/hooks/useProfile'

/**
 * 社交链接。
 * 简历中没有提供其他社交账号，所以 socials 为空时整个区域不渲染，而不是留一段空白。
 */
export function SocialLinks() {
  const { socials } = useProfile()

  if (socials.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {socials.map((social) => (
        <li key={social.label}>
          <a
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
          >
            {social.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
