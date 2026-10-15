import { ArrowUp } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useProfile } from '@/hooks/useProfile'
import { useSettings } from '@/hooks/useSettings'

export function Footer() {
  const year = new Date().getFullYear()
  const { name, email, resumeUrl } = useProfile()
  const { footerNote } = useSettings()

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-gutter py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-fg-muted">
            © {year} {name}
          </p>
          <a
            href={`mailto:${email}`}
            className="text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
          >
            {email}
          </a>
          {footerNote ? <p className="text-xs text-fg-subtle">{footerNote}</p> : null}
        </div>

        <nav aria-label="页脚导航">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <li>
              <Link
                to="/projects"
                className="text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
              >
                项目
              </Link>
            </li>
            <li>
              <Link
                to="/blog"
                className="text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
              >
                博客
              </Link>
            </li>
            {resumeUrl ? (
              <li>
                <a
                  href={resumeUrl}
                  download
                  className="text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
                >
                  简历
                </a>
              </li>
            ) : null}
            <li>
              <a
                href="#main"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm text-fg-muted transition-colors duration-200 ease-standard hover:text-accent"
              >
                <ArrowUp size={14} aria-hidden="true" />
                返回顶部
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
