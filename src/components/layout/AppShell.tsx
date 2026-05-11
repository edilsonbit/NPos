import { Box, Toolbar } from '@mui/material'
import { type ReactNode } from 'react'
import { Header } from './Header'
import { DRAWER_WIDTH, Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

const AppShell = ({ children }: AppShellProps) => (
  <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
    <Sidebar />
    <Header />
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: `${DRAWER_WIDTH}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Toolbar sx={{ minHeight: '72px !important' }} />
      <Box sx={{ p: 3, flexGrow: 1 }}>{children}</Box>
    </Box>
  </Box>
)

export { AppShell }
