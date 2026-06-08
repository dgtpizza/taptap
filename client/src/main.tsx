import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppBackdrop } from '@/shared/ui/AppBackdrop'
import '@/styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

createRoot(root).render(
  <StrictMode>
    <AppBackdrop />
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
