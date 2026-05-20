import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
} from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import { useEffect, useState } from 'react'
import { DRAWER_WIDTH } from './Sidebar'

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

const Header = () => {
  const [language, setLanguage] = useState<LanguageCode>(getStoredLanguage)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)

  useEffect(() => {
    saveLanguage(language)
  }, [language])

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
            <IconButton
              size="small"
              aria-label={languageAriaLabel[language]}
              onClick={(event) => setAnchorEl(event.currentTarget)}
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
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
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
            {languageOptions.map((option) => {
              const selected = option.code === language
              return (
                <MenuItem
                  key={option.code}
                  selected={selected}
                  onClick={() => {
                    setLanguage(option.code)
                    setAnchorEl(null)
                  }}
                >
                  <ListItemText
                    primary={option.label}
                    secondary={option.subtitle}
                  />
                </MenuItem>
              )
            })}
          </Menu>
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
}

export { Header }
