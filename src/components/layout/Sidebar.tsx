import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ApiIcon from '@mui/icons-material/Api'
import BugReportIcon from '@mui/icons-material/BugReport'
import CloudIcon from '@mui/icons-material/Cloud'
import CodeIcon from '@mui/icons-material/Code'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ForkRightIcon from '@mui/icons-material/ForkRight'
import GroupIcon from '@mui/icons-material/Group'
import HubIcon from '@mui/icons-material/Hub'
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
import { useLanguage } from '../../i18n/LanguageContext'
import type { Translations } from '../../i18n/translations'

const DRAWER_WIDTH = 240
const DRAWER_WIDTH_COLLAPSED = 64

interface NavItem {
  icon: ReactNode
  label: string
  pageKey: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

const getNavSections = (t: Translations): NavSection[] => [
  {
    label: t.sidebar.sections.monitoring,
    items: [
      { icon: <DashboardIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.dashboard, pageKey: 'dashboard' },
      { icon: <ReceiptLongIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.fiscalCoupons, pageKey: 'cupons' },
      { icon: <ReceiptLongIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.cancelledCoupons, pageKey: 'cupons-cancelados' },
      { icon: <HubIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.aggregator, pageKey: 'agregador' },
      { icon: <BugReportIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.apiTester, pageKey: 'api-tester' },
      { icon: <ReplayIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.orderResend, pageKey: 'reenvio' },
      { icon: <CodeIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.payloadEditor, pageKey: 'payload' },
    ],
  },
  {
    label: t.sidebar.sections.reports,
    items: [
      { icon: <NotificationsIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.integrationAlerts, pageKey: 'alertas' },
      { icon: <WarningIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.nonIntegrated, pageKey: 'pedidos-ni' },
    ],
  },
  {
    label: t.sidebar.sections.reconciliation,
    items: [
      { icon: <AccountBalanceIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.adminFee, pageKey: 'taxa' },
      { icon: <OpenInNewIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.externalEntries, pageKey: 'lancamentos' },
      { icon: <CompareArrowsIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.reconciliation, pageKey: 'conciliacao' },
    ],
  },
  {
    label: t.sidebar.sections.records,
    items: [
      { icon: <CloudIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.environment, pageKey: 'ambiente' },
      { icon: <PersonIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.client, pageKey: 'cliente' },
      { icon: <SwapHorizIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.depara, pageKey: 'depara' },
      { icon: <ApiIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.endpoint, pageKey: 'endpoint' },
      { icon: <HubIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.integration, pageKey: 'integracao' },
      { icon: <ForkRightIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.routingSteps, pageKey: 'passos' },
      { icon: <RouteIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.routing, pageKey: 'roteamento' },
    ],
  },
  {
    label: t.sidebar.sections.settings,
    items: [
      { icon: <GroupIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.users, pageKey: 'usuarios' },
      { icon: <TuneIcon sx={{ fontSize: 18 }} />, label: t.sidebar.items.aggregatorConfig, pageKey: 'config-agregador' },
    ],
  },
]

interface SidebarProps {
  activePage: string
  onNavigate: (pageKey: string) => void
  collapsed: boolean
}

const Sidebar = ({ activePage, onNavigate, collapsed }: SidebarProps) => {
  const { t } = useLanguage()
  const navSections = getNavSections(t)
  const width = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          backgroundColor: '#fff',
          borderRight: '1px solid #e8ecf0',
          overflowX: 'hidden',
          transition: 'width 0.2s',
          height: '100%',
          position: 'fixed',
          top: '56px', // Garante que o menu começa abaixo do Header fixo
          left: 0,
          zIndex: 1100, // Menor que o Header (1200)
        },
      }}
    >
      <Box sx={{ overflowY: 'auto', overflowX: 'hidden', flexGrow: 1, pb: 2, height: 'calc(100vh - 56px)', pt: 0 }}>
        {navSections.map((section) => (
          <Box key={section.label}>
            {!collapsed && (
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
            )}
            {collapsed && <Box sx={{ pt: 1 }} />}
            <List dense disablePadding>
              {section.items.map((item) => {
                const isActive = item.pageKey === activePage
                return (
                  <Tooltip
                    key={item.label}
                    title={collapsed ? item.label : ''}
                    placement="right"
                  >
                    <ListItem
                      onClick={() => onNavigate(item.pageKey)}
                      sx={{
                        px: collapsed ? 0 : 1.5,
                        pt: '10px',
                        pb: '10px',
                        mx: collapsed ? 0 : 0.75,
                        width: collapsed ? '100%' : 'calc(100% - 12px)',
                        borderRadius: collapsed ? 0 : '6px',
                        cursor: 'pointer',
                        justifyContent: 'center',
                        backgroundColor: isActive && !collapsed ? '#e8f4ff' : 'transparent',
                        '&:hover': {
                          backgroundColor: isActive && !collapsed
                            ? '#e8f4ff'
                            : 'rgba(0,0,0,0.04)',
                        },
                        transition: 'background 0.15s',
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: collapsed ? 0 : 30,
                          justifyContent: 'center',
                          // No modo colapsado, ícone ativo tem fundo azul arredondado
                          ...(collapsed && isActive && {
                            backgroundColor: '#1976d2',
                            borderRadius: '8px',
                            p: '6px',
                            color: '#fff',
                          }),
                          ...(!collapsed && { color: isActive ? '#1565c0' : '#757575' }),
                          ...(collapsed && !isActive && { color: '#757575' }),
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          primary={item.label}
                          slotProps={{
                            primary: {
                              style: {
                                fontSize: 13,
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? '#1565c0' : '#424242',
                                lineHeight: 1.3,
                              },
                            },
                          }}
                        />
                      )}
                    </ListItem>
                  </Tooltip>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Drawer>
  )
}

export { Sidebar, DRAWER_WIDTH, DRAWER_WIDTH_COLLAPSED }

