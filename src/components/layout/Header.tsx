import { AppBar, Avatar, Box, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import TranslateIcon from '@mui/icons-material/Translate'
import LogoutIcon from '@mui/icons-material/Logout'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
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
  onOpenAssistant: () => void
}

const Header = ({ userEmail, onLogout, onToggleSidebar, onOpenAssistant }: HeaderProps) => {
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
          <Tooltip title="Abrir Assistente IA (Ctrl+Enter)">
            <Box
              component="button"
              type="button"
              onClick={onOpenAssistant}
              sx={{
                outline: 'none',
                cursor: 'pointer',
                borderRadius: 999,
                px: { xs: 1.2, sm: 1.8 },
                py: 0.8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                color: '#fff',
                background: 'linear-gradient(135deg, #0f766e 0%, #1d4ed8 52%, #0284c7 100%)',
                border: '1px solid rgba(255,255,255,0.22)',
                boxShadow: '0 8px 22px rgba(29,78,216,0.34), inset 0 1px 0 rgba(255,255,255,0.28)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0d6b64 0%, #1e40af 54%, #0369a1 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 12px 28px rgba(30,64,175,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              }}
            >
              <SmartToyIcon sx={{ fontSize: 18, color: '#7dd3fc' }} />
              <Typography
                component="span"
                sx={{
                  display: 'inline',
                  fontSize: { xs: 12, sm: 13 },
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                IA
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {' '}Assistente
                </Box>
              </Typography>
              <AutoAwesomeIcon sx={{ fontSize: 16, opacity: 0.95, color: '#fde68a' }} />
            </Box>
          </Tooltip>
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
