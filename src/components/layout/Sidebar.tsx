import {
  Box,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import HubIcon from '@mui/icons-material/Hub'
import SendIcon from '@mui/icons-material/Send'
import SettingsIcon from '@mui/icons-material/Settings'
import { appConfig } from '../../config/appConfig'

const DRAWER_WIDTH = 260

const menuItems = [
  { icon: <DashboardIcon />, label: 'Cupons Fiscais' },
  { icon: <HubIcon />, label: 'Agregador' },
  { icon: <SendIcon />, label: 'Envio SAP' },
  { icon: <SettingsIcon />, label: 'Configurações' },
]

const Sidebar = () => (
  <Drawer
    variant="permanent"
    sx={{
      width: DRAWER_WIDTH,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: DRAWER_WIDTH,
        boxSizing: 'border-box',
        background: 'linear-gradient(160deg, #0d3b45 0%, #062930 100%)',
        color: '#fff',
        borderRight: 'none',
      },
    }}
  >
    <Toolbar
      sx={{
        px: 3,
        py: 2.5,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        minHeight: '72px !important',
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: 1 }}>
          NPos
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
          Boticário | Cupons Fiscais
        </Typography>
      </Box>
    </Toolbar>

    <List sx={{ pt: 2, px: 1 }}>
      {menuItems.map((item, idx) => (
        <ListItem
          key={item.label}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            cursor: 'pointer',
            backgroundColor: idx === 0 ? 'rgba(255,255,255,0.12)' : 'transparent',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
            transition: 'background 0.2s',
          }}
        >
          <ListItemIcon sx={{ color: idx === 0 ? '#7ecfdc' : 'rgba(255,255,255,0.5)', minWidth: 38 }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            slotProps={{
              primary: {
                style: {
                  fontSize: 14,
                  fontWeight: idx === 0 ? 600 : 400,
                  color: idx === 0 ? '#fff' : 'rgba(255,255,255,0.65)',
                },
              },
            }}
          />
        </ListItem>
      ))}
    </List>

    <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <Chip
        size="small"
        label={`Origem: ${appConfig.dataSource}`}
        sx={{
          backgroundColor: appConfig.dataSource === 'firebase' ? '#2e7d32' : '#1565c0',
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
        }}
      />
    </Box>
  </Drawer>
)

export { Sidebar, DRAWER_WIDTH }
