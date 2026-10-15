import { Spinner } from '@/components/ui/Spinner'

interface PageLoadingProps {
  label?: string
}

export function PageLoading({ label = '正在加载内容' }: PageLoadingProps) {
  return (
    <div className="mx-auto flex w-full max-w-content items-center gap-3 px-gutter py-section sm:px-8">
      <Spinner label={label} className="text-fg-muted" />
      <span className="text-sm text-fg-muted">{label}…</span>
    </div>
  )
}
