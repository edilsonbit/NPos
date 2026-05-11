import { AppBar, Box, Breadcrumbs, Link, Toolbar, Typography } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { DRAWER_WIDTH } from './Sidebar'

interface HeaderProps {
  breadcrumb?: string
}

const Header = ({ breadcrumb = 'Cupons Fiscais' }: HeaderProps) => (
  <AppBar
    position="fixed"
    elevation={0}
    sx={{
      width: `calc(100% - ${DRAWER_WIDTH}px)`,
      ml: `${DRAWER_WIDTH}px`,
      backgroundColor: '#fff',
      borderBottom: '1px solid #e0e7ef',
      color: '#1a2c3d',
    }}
  >
    <Toolbar sx={{ minHeight: '72px !important', px: 3, justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="subtitle2" sx={{ color: '#6b7a8d', fontSize: 12, mb: 0.25 }}>
          NPos — Boticário
        </Typography>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="inherit" />}>
          <Link underline="hover" color="inherit" sx={{ fontSize: 13, color: '#6b7a8d', cursor: 'pointer' }}>
            Início
          </Link>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a2c3d' }}>
            {breadcrumb}
          </Typography>
        </Breadcrumbs>
      </Box>
    </Toolbar>
  </AppBar>
)

export { Header }
