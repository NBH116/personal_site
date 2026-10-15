import { RotateCcw, Save, TriangleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import {
  getSettings,
  isSettingsCustomized,
  isStorageAvailable,
  resetAllContent,
  resetSettings,
  saveSettings,
} from '@/api'
import type { SiteSettings } from '@/data/settings'
import { accentPresets } from '@/data/settings'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import {
  CheckboxField,
  FormSection,
  NumberField,
  TextAreaField,
  TextField,
} from '@/components/admin/Field'
import { FormStatus, type FormStatusKind } from '@/components/admin/FormStatus'
import { Button } from '@/components/ui/Button'
import { useApiValue } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cx } from '@/lib/cx'
import {
  collectMessages,
  firstFieldErrors,
  settingsSchema,
  type SettingsFieldErrors,
  type SettingsValues,
} from '@/schemas/admin'

function toValues(settings: SiteSettings): SettingsValues {
  return { ...settings }
}

/**
 * 站点设置。
 *
 * 强调色的色块用内联 `backgroundColor` 是刻意的例外：色值存放在
 * `src/data/settings.ts` 的预设里（TECH_DESIGN 5.7 —— 只存 key，色值留在数据文件），
 * 组件里出现的是 `preset.accent` 这个变量而不是色值字面量。不这么做的话，
 * 换色板时组件里会多出一份需要人工同步的颜色表。
 */
export function AdminSettingsPage() {
  const settings = useApiValue(getSettings)

  const [values, setValues] = useState<SettingsValues>(() => toValues(settings))
  const [errors, setErrors] = useState<SettingsFieldErrors>({})
  const [status, setStatus] = useState<FormStatusKind>('idle')
  const [message, setMessage] = useState('')
  const [issues, setIssues] = useState<string[]>([])
  const [confirmResetSettings, setConfirmResetSettings] = useState(false)
  const [confirmResetAll, setConfirmResetAll] = useState(false)

  useDocumentTitle('站点设置')

  const patch = (changes: Partial<SettingsValues>) => {
    setValues((previous) => ({ ...previous, ...changes }))
    setStatus('idle')
    setMessage('')
    setIssues([])
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = settingsSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(firstFieldErrors<keyof SettingsValues>(parsed.error))
      setIssues(collectMessages(parsed.error))
      setStatus('error')
      setMessage('有字段没有通过校验，请检查下面列出的问题。')
      return
    }

    setErrors({})
    setIssues([])
    saveSettings(parsed.data)
    setStatus('success')
    setMessage('已保存。标题、强调色与星空开关会立即生效。')
  }

  const handleResetSettings = () => {
    resetSettings()
    setValues(toValues(getSettings()))
    setConfirmResetSettings(false)
    setStatus('success')
    setMessage('已恢复仓库里的默认站点设置。')
  }

  const handleResetAll = () => {
    resetAllContent()
    setValues(toValues(getSettings()))
    setConfirmResetAll(false)
    setStatus('success')
    setMessage('已清空本浏览器保存的全部后台改动，站点回到仓库内容。')
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AdminPageHeader
        title="站点设置"
        description="这几项不属于某一条内容，而是整站的展示参数。保存后前台的标题、强调色、星空与首页条数会立刻跟着变。"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={!isSettingsCustomized()}
              onClick={() => setConfirmResetSettings(true)}
            >
              <RotateCcw size={16} aria-hidden="true" />
              恢复默认设置
            </Button>
            <Button type="submit">
              <Save size={16} aria-hidden="true" />
              保存
            </Button>
          </>
        }
      >
        <FormStatus status={status} message={message} issues={issues} />
      </AdminPageHeader>

      <div className="flex flex-col gap-6">
        {isStorageAvailable() ? null : (
          <p className="flex items-start gap-3 rounded-card border border-border bg-surface p-4 text-sm text-fg-muted">
            <TriangleAlert size={16} className="mt-1 shrink-0 text-danger" aria-hidden="true" />
            当前浏览器不允许写入 localStorage（可能是隐私模式）。本页的保存不会生效，后台会一直显示仓库里的默认内容。
          </p>
        )}

        <FormSection title="站点信息" description="浏览器标题与分享摘要都用这里的值。">
          <TextField
            id="settings-site-title"
            label="站点标题"
            value={values.siteTitle}
            error={errors.siteTitle}
            hint="作为各页面标题的后缀，形如「关于 | 个人主页」。"
            onChange={(value) => patch({ siteTitle: value })}
          />
          <TextAreaField
            id="settings-site-description"
            label="站点描述"
            rows={2}
            value={values.siteDescription}
            error={errors.siteDescription}
            hint="写入 meta description，供搜索引擎与分享卡片使用。"
            onChange={(value) => patch({ siteDescription: value })}
          />
          <TextField
            id="settings-footer-note"
            label="页脚补充文字"
            value={values.footerNote}
            error={errors.footerNote}
            hint="留空则页脚只显示版权与导航。"
            onChange={(value) => patch({ footerNote: value })}
          />
        </FormSection>

        <FormSection title="外观" description="只做深色主题，这里调整的是强调色与背景动效。">
          <fieldset>
            <legend className="text-sm text-fg">强调色</legend>
            <p className="mt-1 text-xs text-fg-subtle">
              影响全站链接、按钮与选中态。保存后立即生效。
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {accentPresets.map((preset) => (
                <label
                  key={preset.key}
                  className={cx(
                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-control border px-3 py-2 text-sm transition-colors duration-200 ease-standard',
                    values.accent === preset.key
                      ? 'border-accent bg-accent-soft text-fg'
                      : 'border-border bg-bg text-fg-muted hover:bg-surface-hover hover:text-fg',
                  )}
                >
                  <input
                    type="radio"
                    name="settings-accent"
                    value={preset.key}
                    checked={values.accent === preset.key}
                    onChange={() => patch({ accent: preset.key })}
                    className="size-4 accent-accent"
                  />
                  <span
                    aria-hidden="true"
                    className="size-4 shrink-0 rounded-full"
                    style={{ backgroundColor: preset.accent }}
                  />
                  {preset.label}
                </label>
              ))}
            </div>
          </fieldset>

          <CheckboxField
            id="settings-starfield"
            label="启用全站星空背景"
            checked={values.starfieldEnabled}
            hint="关闭后前台与后台都不再挂载 Canvas 画布。低端设备上关闭可以省电。"
            onChange={(starfieldEnabled) => patch({ starfieldEnabled })}
          />
        </FormSection>

        <FormSection title="首页区块" description="控制首页「项目概览」与「最新文章」展示的条数。">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id="settings-home-projects"
              label="首页项目条数"
              min={1}
              max={12}
              value={values.homeProjectCount}
              error={errors.homeProjectCount}
              onChange={(homeProjectCount) => patch({ homeProjectCount })}
            />
            <NumberField
              id="settings-home-posts"
              label="首页文章条数"
              min={1}
              max={12}
              value={values.homePostCount}
              error={errors.homePostCount}
              onChange={(homePostCount) => patch({ homePostCount })}
            />
          </div>
        </FormSection>

        <FormSection
          title="数据管理"
          description="后台的改动保存在当前浏览器的 localStorage 里，仓库中的 Markdown 与 src/data 始终是兜底默认值。"
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs text-fg-subtle">
              {isSettingsCustomized() ? '当前：站点设置已自定义' : '当前：使用仓库默认设置'}
            </span>
          </div>

          <div className="rounded-card border border-danger bg-danger-soft p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-danger">
              <TriangleAlert size={16} aria-hidden="true" />
              清空全部后台改动
            </h3>
            <p className="mt-2 text-sm text-fg-muted">
              把个人信息、技能、项目、博客与站点设置全部恢复成仓库里的内容，并删除后台新建的条目与正文。
              换浏览器、清缓存也会得到同样的结果。此操作不可撤销。
            </p>
            <Button
              type="button"
              variant="danger"
              className="mt-4"
              onClick={() => setConfirmResetAll(true)}
            >
              <RotateCcw size={16} aria-hidden="true" />
              清空全部改动
            </Button>
          </div>
        </FormSection>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button type="submit">
          <Save size={16} aria-hidden="true" />
          保存
        </Button>
      </div>

      <ConfirmDialog
        open={confirmResetSettings}
        title="恢复默认站点设置？"
        description="这会丢弃你在本页做过的全部修改，恢复成 src/data/settings.ts 里的默认值。其他内容（个人信息、技能、项目、博客）不受影响。"
        confirmLabel="恢复默认"
        onConfirm={handleResetSettings}
        onCancel={() => setConfirmResetSettings(false)}
      />

      <ConfirmDialog
        open={confirmResetAll}
        title="清空全部后台改动？"
        description="个人信息、技能、项目、博客与站点设置都会回到仓库内容，后台新建的条目与正文会被删除。此操作不可撤销。"
        confirmLabel="清空全部改动"
        onConfirm={handleResetAll}
        onCancel={() => setConfirmResetAll(false)}
      />
    </form>
  )
}
