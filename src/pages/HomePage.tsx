import { About } from '@/sections/About'
import { BlogPreview } from '@/sections/BlogPreview'
import { Contact } from '@/sections/Contact'
import { Hero } from '@/sections/Hero'
import { ProjectsPreview } from '@/sections/ProjectsPreview'
import { Skills } from '@/sections/Skills'
import { useApiValue } from '@/hooks/useApiValue'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useProfile } from '@/hooks/useProfile'
import { useSettings } from '@/hooks/useSettings'
import { getPosts, getProjects } from '@/lib/content'

export function HomePage() {
  const projects = useApiValue(getProjects)
  const posts = useApiValue(getPosts)
  const { homeProjectCount, homePostCount } = useSettings()
  const profile = useProfile()

  useDocumentTitle(profile.tagline)

  return (
    <>
      <Hero />
      <About />
      <Skills />
      <ProjectsPreview projects={projects} limit={homeProjectCount} />
      <BlogPreview posts={posts} limit={homePostCount} />
      <Contact />
    </>
  )
}
