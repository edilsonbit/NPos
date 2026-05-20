import { AppBar, Avatar, Box, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import TranslateIcon from '@mui/icons-material/Translate'
import LogoutIcon from '@mui/icons-material/Logout'
import { useEffect, useState } from 'react'

const LANGUAGE_STORAGE_KEY = 'npos-language'

interface LanguageOption {
  code: 'pt' | 'en' | 'es'
  label: string
  subtitle?: string
}

const languageOptions: LanguageOption[] = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English', subtitle: '(Inglês)' },
  { code: 'es', label: 'Español', subtitle: '(Espanhol)' },
]

const languageAriaLabel: Record<LanguageOption['code'], string> = {
  pt: 'Seletor de idioma',
  en: 'Language selector',
  es: 'Selector de idioma',
}

const languageTooltipLabel: Record<LanguageOption['code'], string> = {
  pt: 'Idioma',
  en: 'Language',
  es: 'Idioma',
}

type LanguageCode = (typeof languageOptions)[number]['code']

const isLanguageCode = (value: string | null): value is LanguageCode =>
  languageOptions.some((option) => option.code === value)

const getStoredLanguage = (): LanguageCode => {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguageCode(saved) ? saved : 'pt'
  } catch {
    return 'pt'
  }
}

const saveLanguage = (value: LanguageCode) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value)
  } catch {
    // no-op when localStorage is unavailable
  }
}

interface HeaderProps {
  userEmail?: string
  onLogout?: () => void
  onToggleSidebar: () => void
}

const Header = ({ userEmail, onLogout, onToggleSidebar }: HeaderProps) => {
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null)
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null)
  const [language, setLanguage] = useState<LanguageCode>(getStoredLanguage)
  const letter = userEmail ? userEmail[0].toUpperCase() : 'U'

  useEffect(() => {
    saveLanguage(language)
  }, [language])

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
          <Tooltip title={languageTooltipLabel[language]}>
            <IconButton
              size="small"
              aria-label={languageAriaLabel[language]}
              onClick={(e) => setLangAnchorEl(e.currentTarget)}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#1e9bd7',
                color: '#fff',
                '&:hover': { backgroundColor: '#178bc3' },
              }}
            >
              <TranslateIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Perfil">
            <Avatar
              onClick={(e) => setProfileAnchorEl(e.currentTarget)}
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
            <Typography variant="caption" color="text.secondary">Logado como</Typography>
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
          Sair
        </MenuItem>
      </Menu>
    </AppBar>
  )
}

export { Header }
