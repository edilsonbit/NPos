import { AppBar, Avatar, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import LogoutIcon from '@mui/icons-material/Logout'
import { useState } from 'react'
import { DRAWER_WIDTH } from './Sidebar'

interface HeaderProps {
  userEmail?: string
  onLogout?: () => void
}

const Header = ({ userEmail, onLogout }: HeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const letter = userEmail ? userEmail[0].toUpperCase() : 'U'

  return (
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
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#1976d2',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {letter}
            </Avatar>
          </Tooltip>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { elevation: 3, sx: { minWidth: 200, mt: 0.5 } } }}
      >
        {userEmail && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Logado como</Typography>
            <Typography variant="body2" fontWeight={600} noWrap>{userEmail}</Typography>
          </Box>
        )}
        <Divider />
        <MenuItem
          onClick={() => { setAnchorEl(null); onLogout?.() }}
          sx={{ color: '#c62828', mt: 0.5 }}
        >
          <ListItemIcon sx={{ color: '#c62828' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>
    </AppBar>
  )
}

export { Header }
