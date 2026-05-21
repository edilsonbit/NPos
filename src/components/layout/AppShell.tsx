import { Box, useMediaQuery, useTheme } from '@mui/material'
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((v) => !v)
    } else {
      setCollapsed((v) => !v)
    }
  }

  const sidebarWidth = isMobile ? 0 : collapsed ? 64 : 240

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #ffffff 0%, #f2f5f9 100%)' }}>
      {/* Header 100% fixo */}
      <Header userEmail={userEmail} onLogout={onLogout} onToggleSidebar={handleToggleSidebar} />

      {/* Sidebar + Main Content - começa abaixo do Header fixo */}
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 56px)', marginTop: '56px' }}>
        <Sidebar
          activePage={activePage}
          onNavigate={(key) => { onNavigate(key); if (isMobile) setMobileOpen(false) }}
          collapsed={collapsed}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <Box
          component="main"
          sx={{
            backgroundColor: { xs: '#eef2f6', md: '#eef2f6' },
            minWidth: '1%',
            width: `calc(100% - ${sidebarWidth}px)`,
            minHeight: 'calc(100vh - 76px)',
            flexGrow: 1,
            marginTop: { xs: 0, md: '20px' },
            marginRight: { xs: 0, md: '20px' },
            marginLeft: { xs: 0, md: '20px' },
            padding: { xs: '10px 10px 12px 10px', md: '20px' },
            borderRadius: { xs: 0, md: '8px 8px 0px 0px' },
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            transition: 'margin 400ms cubic-bezier(0, 0, 0.2, 1)',
          }}
        >
          <Box sx={{ p: { xs: 0.5, md: 3 }, flexGrow: 1, minWidth: 0 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export { AppShell }
