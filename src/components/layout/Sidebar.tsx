import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ApiIcon from '@mui/icons-material/Api'
import CloudIcon from '@mui/icons-material/Cloud'
import CodeIcon from '@mui/icons-material/Code'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ForkRightIcon from '@mui/icons-material/ForkRight'
import GroupIcon from '@mui/icons-material/Group'
import HubIcon from '@mui/icons-material/Hub'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsIcon from '@mui/icons-material/Notifications'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PersonIcon from '@mui/icons-material/Person'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ReplayIcon from '@mui/icons-material/Replay'
import RouteIcon from '@mui/icons-material/Route'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import TuneIcon from '@mui/icons-material/Tune'
import WarningIcon from '@mui/icons-material/Warning'
import { type ReactNode } from 'react'

const DRAWER_WIDTH = 240

interface NavItem {
  icon: ReactNode
  label: string
  pageKey: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: 'Monitoramento',
    items: [
      { icon: <DashboardIcon sx={{ fontSize: 18 }} />, label: 'Dashboard', pageKey: 'dashboard' },
      { icon: <ReceiptLongIcon sx={{ fontSize: 18 }} />, label: 'Cupons Fiscais', pageKey: 'cupons' },
      { icon: <HubIcon sx={{ fontSize: 18 }} />, label: 'Agregador', pageKey: 'agregador' },
      { icon: <ReplayIcon sx={{ fontSize: 18 }} />, label: 'Reenvio Pedido', pageKey: 'reenvio' },
      { icon: <CodeIcon sx={{ fontSize: 18 }} />, label: 'Edição Payload', pageKey: 'payload' },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      { icon: <NotificationsIcon sx={{ fontSize: 18 }} />, label: 'Alerta das integrações', pageKey: 'alertas' },
      { icon: <WarningIcon sx={{ fontSize: 18 }} />, label: 'Pedidos não integrados', pageKey: 'pedidos-ni' },
    ],
  },
  {
    label: 'Conciliação',
    items: [
      { icon: <AccountBalanceIcon sx={{ fontSize: 18 }} />, label: 'Taxa Administrativa', pageKey: 'taxa' },
      { icon: <OpenInNewIcon sx={{ fontSize: 18 }} />, label: 'Lançamentos Externos', pageKey: 'lancamentos' },
      { icon: <CompareArrowsIcon sx={{ fontSize: 18 }} />, label: 'Conciliação', pageKey: 'conciliacao' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { icon: <CloudIcon sx={{ fontSize: 18 }} />, label: 'Ambiente', pageKey: 'ambiente' },
      { icon: <PersonIcon sx={{ fontSize: 18 }} />, label: 'Cliente', pageKey: 'cliente' },
      { icon: <SwapHorizIcon sx={{ fontSize: 18 }} />, label: 'De Para', pageKey: 'depara' },
      { icon: <ApiIcon sx={{ fontSize: 18 }} />, label: 'Endpoint', pageKey: 'endpoint' },
      { icon: <HubIcon sx={{ fontSize: 18 }} />, label: 'Integração', pageKey: 'integracao' },
      { icon: <ForkRightIcon sx={{ fontSize: 18 }} />, label: 'Passos Roteamento', pageKey: 'passos' },
      { icon: <RouteIcon sx={{ fontSize: 18 }} />, label: 'Roteamento', pageKey: 'roteamento' },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { icon: <GroupIcon sx={{ fontSize: 18 }} />, label: 'Usuários', pageKey: 'usuarios' },
      { icon: <TuneIcon sx={{ fontSize: 18 }} />, label: 'Agregador', pageKey: 'config-agregador' },
    ],
  },
]

interface SidebarProps {
  activePage: string
  onNavigate: (pageKey: string) => void
}

const Sidebar = ({ activePage, onNavigate }: SidebarProps) => (
  <Drawer
    variant="permanent"
    sx={{
      width: DRAWER_WIDTH,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: DRAWER_WIDTH,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        borderRight: '1px solid #e8ecf0',
        overflowX: 'hidden',
      },
    }}
  >
    {/* Logo */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1.25,
        borderBottom: '1px solid #e8ecf0',
        minHeight: 56,
      }}
    >
      <Box
        component="img"
        src="/images/logo_qas.png"
        alt="Logo"
        sx={{ height: 36, maxWidth: 180, objectFit: 'contain' }}
      />
      <MenuIcon sx={{ color: '#bdbdbd', fontSize: 20, cursor: 'pointer' }} />
    </Box>

    {/* Seções de navegação */}
    <Box sx={{ overflowY: 'auto', overflowX: 'hidden', flexGrow: 1, pb: 2 }}>
      {navSections.map((section) => (
        <Box key={section.label}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: '#9e9e9e',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              px: 2,
              pt: 2,
              pb: 0.5,
            }}
          >
            {section.label}
          </Typography>
          <List dense disablePadding>
            {section.items.map((item) => {
              const isActive = item.pageKey === activePage
              return (
                <ListItem
                  key={item.label}
                  onClick={() => onNavigate(item.pageKey)}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    mx: 0.75,
                    width: 'calc(100% - 12px)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#1565c0' : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive ? '#1565c0' : 'rgba(0,0,0,0.04)',
                    },
                    transition: 'background 0.15s',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? '#fff' : '#757575',
                      minWidth: 30,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        style: {
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? '#fff' : '#424242',
                          lineHeight: 1.3,
                        },
                      },
                    }}
                  />
                </ListItem>
              )
            })}
          </List>
        </Box>
      ))}
    </Box>
  </Drawer>
)

export { Sidebar, DRAWER_WIDTH }
