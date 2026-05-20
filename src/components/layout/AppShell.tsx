import { Box } from '@mui/material'
import { useState, type ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  activePage: string
  onNavigate: (pageKey: string) => void
  children: ReactNode
  userEmail?: string
  onLogout?: () => void
}

const AppShell = ({ activePage, onNavigate, children, userEmail, onLogout }: AppShellProps) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f6fa' }}>
      {/* Header 100% fixo */}
      <Header userEmail={userEmail} onLogout={onLogout} onToggleSidebar={() => setCollapsed((v) => !v)} />
      
      {/* Sidebar + Main Content - começa abaixo do Header fixo */}
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 56px)', marginTop: '56px' }}>
        <Sidebar
          activePage={activePage}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'auto',
          }}
        >
          <Box sx={{ p: 3, flexGrow: 1, minWidth: 0 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export { AppShell }
