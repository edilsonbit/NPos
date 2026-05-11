import { Box, Toolbar } from '@mui/material'
import { type ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  activePage: string
  onNavigate: (pageKey: string) => void
  children: ReactNode
}

const AppShell = ({ activePage, onNavigate, children }: AppShellProps) => (
  <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f6fa' }}>
    <Sidebar activePage={activePage} onNavigate={onNavigate} />
    <Header />
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      <Toolbar sx={{ minHeight: '56px !important' }} />
      <Box sx={{ p: 3, flexGrow: 1, minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  </Box>
)

export { AppShell }
