import { AppBar, Avatar, Box, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import TranslateIcon from '@mui/icons-material/Translate'
import LogoutIcon from '@mui/icons-material/Logout'
import { useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'

const languageOptions = [
  { code: 'pt' as const, label: 'Português' },
  { code: 'en' as const, label: 'English', subtitle: '(Inglês)' },
  { code: 'es' as const, label: 'Español', subtitle: '(Espanhol)' },
]

interface HeaderProps {
  userEmail?: string
  onLogout?: () => void
  onToggleSidebar: () => void
}

const Header = ({ userEmail, onLogout, onToggleSidebar }: HeaderProps) => {
  const { language, setLanguage, t } = useLanguage()
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null)
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null)
  const letter = userEmail ? userEmail[0].toUpperCase() : 'U'

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: '100%',
        top: 0,
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(6px)',
        borderBottom: '1px solid #e8ecf0',
        color: '#1a1a2e',
        zIndex: 1200,
      }}
    >
      <Toolbar sx={{ minHeight: '56px !important', px: { xs: 1.5, sm: 2.5 }, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src={`${import.meta.env.BASE_URL}images/logo_qas.png`}
            alt="Logo"
            sx={{ height: { xs: 34, sm: 36 }, objectFit: 'contain' }}
          />
          <Tooltip title={t.header.toggleMenu}>
            <IconButton size="small" onClick={onToggleSidebar} sx={{ color: '#757575', border: '1px solid #e5e9ef' }}>
              <MenuIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={t.header.language}>
            <IconButton
              size="small"
              aria-label={t.header.language}
              onClick={(e) => setLangAnchorEl(e.currentTarget)}
              sx={{
                width: 34,
                height: 34,
                backgroundColor: '#1e9bd7',
                color: '#fff',
                '&:hover': { backgroundColor: '#178bc3' },
              }}
            >
              <TranslateIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t.header.profile}>
            <Avatar
              onClick={(e) => setProfileAnchorEl(e.currentTarget)}
              sx={{
                width: 34,
                height: 34,
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

      {/* Menu de seleção de idioma */}
      <Menu
        anchorEl={langAnchorEl}
        open={Boolean(langAnchorEl)}
        onClose={() => setLangAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: 2,
              boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
            },
          },
        }}
      >
        {languageOptions.map((option) => (
          <MenuItem
            key={option.code}
            selected={option.code === language}
            onClick={() => {
              setLanguage(option.code)
              setLangAnchorEl(null)
            }}
          >
            <ListItemText primary={option.label} secondary={option.subtitle} />
          </MenuItem>
        ))}
      </Menu>

      {/* Menu de perfil do usuário */}
      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={() => setProfileAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { elevation: 3, sx: { minWidth: 200, mt: 0.5 } } }}
      >
        {userEmail && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">{t.header.loggedInAs}</Typography>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{userEmail}</Typography>
          </Box>
        )}
        <Divider />
        <MenuItem
          onClick={() => { setProfileAnchorEl(null); onLogout?.() }}
          sx={{ color: '#c62828', mt: 0.5 }}
        >
          <ListItemIcon sx={{ color: '#c62828' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          {t.header.signOut}
        </MenuItem>
      </Menu>
    </AppBar>
  )
}

export { Header }
