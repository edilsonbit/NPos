import { AppBar, Avatar, Box, IconButton, Toolbar, Tooltip } from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import { DRAWER_WIDTH } from './Sidebar'

const Header = () => (
  <AppBar
    position="fixed"
    elevation={0}
    sx={{
      width: `calc(100% - ${DRAWER_WIDTH}px)`,
      ml: `${DRAWER_WIDTH}px`,
      backgroundColor: '#fff',
      borderBottom: '1px solid #e8ecf0',
      color: '#1a1a2e',
    }}
  >
    <Toolbar sx={{ minHeight: '56px !important', px: 2.5, justifyContent: 'flex-end' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Idioma">
          <IconButton size="small" sx={{ color: '#757575' }}>
            <TranslateIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Perfil">
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: '#1976d2',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            E
          </Avatar>
        </Tooltip>
      </Box>
    </Toolbar>
  </AppBar>
)

export { Header }
