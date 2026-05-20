import { AppBar, Avatar, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import TranslateIcon from '@mui/icons-material/Translate'
import LogoutIcon from '@mui/icons-material/Logout'
import { useState } from 'react'
interface HeaderProps {
  userEmail?: string
  onLogout?: () => void
  onToggleSidebar: () => void
}

const Header = ({ userEmail, onLogout, onToggleSidebar }: HeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const letter = userEmail ? userEmail[0].toUpperCase() : 'U'

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: '100%',
        top: 0,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e8ecf0',
        color: '#1a1a2e',
        zIndex: 1200,
      }}
    >
      <Toolbar sx={{ minHeight: '56px !important', px: 2.5, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL}images/logo_qas.png`}
            alt="Logo"
            sx={{ height: 36, objectFit: 'contain' }}
          />
          <Tooltip title="Alternar menu">
            <IconButton size="small" onClick={onToggleSidebar} sx={{ color: '#757575' }}>
              <MenuIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>
        </Box>
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
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{userEmail}</Typography>
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
