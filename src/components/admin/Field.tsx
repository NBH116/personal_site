import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

/**
 * 后台表单原语。
 *
 * 为什么集中在一个文件里：后台有六七个表单，字段的视觉、错误关联与必填提示必须
 * 完全一致，否则逐个页面手写 `aria-invalid` / `aria-describedby` 迟早会漏。
 * 这里把「标签 + 控件 + 提示 + 错误」的关联关系封成一个组件，
 * 页面只需要写 `value` / `onChange`，不再直接碰 aria 属性。
 *
 * 无障碍要求（AGENTS.md 五.8）：错误用 `aria-describedby` 关联，控件标 `aria-invalid`，
 * 提示与错误互斥，避免同一段文字被读屏重复朗读。
 */

export const inputClass =
  'w-full rounded-control border bg-bg px-3 py-2 text-sm text-fg transition-colors duration-200 ease-standard placeholder:text-fg-subtle disabled:opacity-60'

export function fieldDescribedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

interface FieldFrameProps {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

/**
 * 「标签 + 控件 + 提示/错误」的骨架。
 * 对外导出是为了让 `TagsInput`、`MarkdownEditor` 这类自定义控件复用同一套关联关系，
 * 而不是各写一份 aria 属性。
 */
export function FieldFrame({ id, label, hint, error, children, className }: FieldFrameProps) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm text-fg">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  hint?: string
  error?: string
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'url' | 'date' | 'password'
  maxLength?: number
  disabled?: boolean
  autoComplete?: string
  className?: string
}

export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  placeholder,
  type = 'text',
  maxLength,
  disabled,
  autoComplete,
  className,
}: TextFieldProps) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} className={className}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescribedBy(id, error, hint)}
        className={cx(inputClass, error ? 'border-danger' : 'border-border focus:border-accent')}
      />
    </FieldFrame>
  )
}

interface TextAreaFieldProps extends Omit<TextFieldProps, 'type' | 'autoComplete' | 'maxLength'> {
  rows?: number
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  placeholder,
  rows = 4,
  disabled,
  className,
}: TextAreaFieldProps) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescribedBy(id, error, hint)}
        className={cx(
          inputClass,
          'resize-y',
          error ? 'border-danger' : 'border-border focus:border-accent',
        )}
      />
    </FieldFrame>
  )
}

interface NumberFieldProps
  extends Omit<TextFieldProps, 'type' | 'value' | 'onChange' | 'maxLength'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  min,
  max,
  disabled,
  className,
}: NumberFieldProps) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} className={className}>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? String(value) : ''}
        min={min}
        max={max}
        onChange={(event) => {
          // 输入框清空会得到 NaN，交给 zod 报「请填写整数」，不在这里编造默认值
          onChange(event.target.value === '' ? Number.NaN : Number(event.target.value))
        }}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescribedBy(id, error, hint)}
        className={cx(inputClass, error ? 'border-danger' : 'border-border focus:border-accent')}
      />
    </FieldFrame>
  )
}

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps extends Omit<TextFieldProps, 'type' | 'maxLength' | 'autoComplete'> {
  options: SelectOption[]
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  options,
  disabled,
  className,
}: SelectFieldProps) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} className={className}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={fieldDescribedBy(id, error, hint)}
        className={cx(inputClass, error ? 'border-danger' : 'border-border focus:border-accent')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  )
}

interface CheckboxFieldProps {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: string
  disabled?: boolean
  className?: string
}

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  hint,
  disabled,
  className,
}: CheckboxFieldProps) {
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="size-4 shrink-0 rounded border-border bg-bg accent-accent"
        />
        {/* 复选框本身只有 16px，但整行标签都可点，触摸目标由 min-h-11 保证 */}
        <label htmlFor={id} className="flex min-h-11 items-center text-sm text-fg">
          {label}
        </label>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface FormSectionProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** 表单里的一个分组卡片：标题 + 说明 + 右上角操作 + 若干字段 */
export function FormSection({
  title,
  description,
  actions,
  children,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cx('rounded-card border border-border bg-surface p-5 sm:p-6', className)}
      aria-label={title}
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}
