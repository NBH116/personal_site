import { cx } from '@/lib/cx'

interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({ className, label = '加载中' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cx(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}
