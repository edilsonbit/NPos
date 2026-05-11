import { Box, Toolbar } from '@mui/material'
import { type ReactNode } from 'react'
import { Header } from './Header'
import { DRAWER_WIDTH, Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

const AppShell = ({ children }: AppShellProps) => (
  <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f6fa' }}>
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
      <Toolbar sx={{ minHeight: '56px !important' }} />
      <Box sx={{ p: 2.5, flexGrow: 1 }}>{children}</Box>
    </Box>
  </Box>
)

export { AppShell }
