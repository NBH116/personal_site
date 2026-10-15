import { RotateCcw, Save } from 'lucide-react'
import { useCallback, useState, type FormEvent } from 'react'

import { getProfile, isProfileCustomized, resetProfile, saveProfile } from '@/api'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { FormSection, TextAreaField, TextField } from '@/components/admin/Field'
import { FormStatus, type FormStatusKind } from '@/components/admin/FormStatus'
import { StringListEditor } from '@/components/admin/StringListEditor'
import { AwardsEditor } from '@/components/admin/profile/AwardsEditor'
import { ExperienceEditor } from '@/components/admin/profile/ExperienceEditor'
import { SocialsEditor } from '@/components/admin/profile/SocialsEditor'
import { Button } from '@/components/ui/Button'
import { useApiValue } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import {
  collectMessages,
  firstFieldErrors,
  profileSchema,
  toProfile,
  toProfileValues,
  type ProfileFieldErrors,
  type ProfileValues,
} from '@/schemas/admin'

/**
 * 个人信息管理。
 *
 * 表单状态在挂载时从数据层拷一份到本地（`useState` 懒初始化），而不是直接受控于
 * `getProfile()`：否则任何一次内容写入都会把用户正在输入的内容冲掉。
 * 只有「恢复默认」这种明确的动作才重新拉取一次。
 */
export function AdminProfilePage() {
  const profile = useApiValue(getProfile)
  const [values, setValues] = useState<ProfileValues>(() => toProfileValues(profile))
  const [errors, setErrors] = useState<ProfileFieldErrors>({})
  const [status, setStatus] = useState<FormStatusKind>('idle')
  const [message, setMessage] = useState('')
  const [issues, setIssues] = useState<string[]>([])
  const [confirmReset, setConfirmReset] = useState(false)

  useDocumentTitle('个人信息')

  const patch = useCallback((changes: Partial<ProfileValues>) => {
    setValues((previous) => ({ ...previous, ...changes }))
    // 改动之后旧的「已保存」提示就不再成立了，清掉避免误导
    setStatus('idle')
    setMessage('')
    setIssues([])
  }, [])

  const reloadFromStore = useCallback(() => {
    setValues(toProfileValues(getProfile()))
    setErrors({})
    setIssues([])
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsed = profileSchema.safeParse(values)

    if (!parsed.success) {
      setErrors(firstFieldErrors<keyof ProfileValues>(parsed.error))
      setIssues(collectMessages(parsed.error))
      setStatus('error')
      setMessage('有字段没有通过校验，请检查下面列出的问题。')
      return
    }

    setErrors({})
    setIssues([])
    saveProfile(toProfile(parsed.data))
    setStatus('success')
    setMessage('已保存。前台页面会立即使用新的内容。')
  }

  const handleReset = () => {
    resetProfile()
    reloadFromStore()
    setConfirmReset(false)
    setStatus('success')
    setMessage('已恢复为仓库里的默认个人信息。')
  }

  return (
    <form id="profile-form" onSubmit={handleSubmit} noValidate>
      <AdminPageHeader
        title="个人信息"
        description="前台首页的头像、简介、技能以外的区块都来自这里，包括经历时间线与荣誉奖项。"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmReset(true)}
              disabled={!isProfileCustomized()}
            >
              <RotateCcw size={16} aria-hidden="true" />
              恢复默认
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
        <FormSection title="基本信息" description="对应首页 Hero 与页脚展示的内容。">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="profile-name"
              label="名字"
              value={values.name}
              error={errors.name}
              onChange={(value) => patch({ name: value })}
            />
            <TextField
              id="profile-location"
              label="所在城市"
              value={values.location}
              error={errors.location}
              placeholder="辽宁 · 大连"
              onChange={(value) => patch({ location: value })}
            />
            <TextField
              id="profile-org"
              label="组织 / 学校"
              value={values.org}
              error={errors.org}
              onChange={(value) => patch({ org: value })}
            />
            <TextField
              id="profile-role"
              label="身份 / 专业"
              value={values.role}
              error={errors.role}
              onChange={(value) => patch({ role: value })}
            />
            <TextField
              id="profile-email"
              label="邮箱"
              type="email"
              value={values.email}
              error={errors.email}
              autoComplete="email"
              onChange={(value) => patch({ email: value })}
            />
            <TextField
              id="profile-phone"
              label="电话"
              type="tel"
              value={values.phone}
              error={errors.phone}
              onChange={(value) => patch({ phone: value })}
            />
          </div>

          <TextAreaField
            id="profile-tagline"
            label="一句话简介"
            rows={2}
            value={values.tagline}
            error={errors.tagline}
            hint="同时作为首页的浏览器标题使用。"
            onChange={(value) => patch({ tagline: value })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="profile-avatar"
              label="头像路径"
              value={values.avatar}
              error={errors.avatar}
              hint="站内路径（如 /avatar.svg）或完整链接；留空则显示首字母方块。"
              onChange={(value) => patch({ avatar: value })}
            />
            <TextField
              id="profile-resume"
              label="简历地址"
              value={values.resumeUrl}
              error={errors.resumeUrl}
              hint="留空则前台不显示「下载简历」按钮。"
              onChange={(value) => patch({ resumeUrl: value })}
            />
          </div>
        </FormSection>

        <FormSection title="个人简介" description="首页「关于我」里的段落，按顺序渲染。">
          {errors.bio ? <p className="text-xs text-danger">{errors.bio}</p> : null}
          <StringListEditor
            id="profile-bio"
            label="简介段落"
            addLabel="新增段落"
            multiline
            hint="建议每段控制在 3 行以内，前台按段落留白。"
            items={values.bio}
            onChange={(bio) => patch({ bio })}
          />
        </FormSection>

        <FormSection title="社交链接" description="留空则前台联系区块不渲染该分组。">
          {errors.socials ? <p className="text-xs text-danger">{errors.socials}</p> : null}
          <SocialsEditor items={values.socials} onChange={(socials) => patch({ socials })} />
        </FormSection>

        <FormSection title="经历时间线" description="教育背景与项目经历，顺序即展示顺序。">
          {errors.experience ? <p className="text-xs text-danger">{errors.experience}</p> : null}
          <ExperienceEditor items={values.experience} onChange={(experience) => patch({ experience })} />
        </FormSection>

        <FormSection title="荣誉奖项" description="按级别分组展示，组内条目顺序自定义。">
          {errors.awards ? <p className="text-xs text-danger">{errors.awards}</p> : null}
          <AwardsEditor groups={values.awards} onChange={(awards) => patch({ awards })} />
        </FormSection>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button type="submit">
          <Save size={16} aria-hidden="true" />
          保存
        </Button>
        <span className="text-xs text-fg-subtle">
          {isProfileCustomized() ? '当前：已自定义' : '当前：使用仓库默认内容'}
        </span>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="恢复默认个人信息？"
        description="这会丢弃你在个人信息页做过的全部修改，恢复成仓库里 src/data 的默认内容。此操作不可撤销。"
        confirmLabel="恢复默认"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </form>
  )
}
