import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { router } from '@/router'

import '@/styles/global.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('找不到 #root 挂载节点，无法启动应用')
}

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
