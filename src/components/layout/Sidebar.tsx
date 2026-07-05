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
import {
  IconAdjustments,
  IconAlertTriangle,
  IconBug,
  IconDashboard,
  IconReceipt,
  IconReceiptOff,
  IconStack2,
} from '@tabler/icons-react'
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
    label: t.sidebar.items.dashboard,
    items: [
      { icon: <IconDashboard size={20} stroke={1.5} />, label: t.sidebar.items.dashboardCoupons, pageKey: 'dashboard-cupons' },
      { icon: <IconReceipt size={20} stroke={1.5} />, label: t.sidebar.items.dashboardLog, pageKey: 'dashboard-log' },
    ],
  },
  {
    label: t.sidebar.sections.monitoring,
    items: [
      { icon: <IconReceipt size={20} stroke={1.5} />, label: t.sidebar.items.fiscalCoupons, pageKey: 'cupons' },
      { icon: <IconReceiptOff size={20} stroke={1.5} />, label: t.sidebar.items.cancelledCoupons, pageKey: 'cupons-cancelados' },
      { icon: <IconStack2 size={20} stroke={1.5} />, label: t.sidebar.items.aggregator, pageKey: 'agregador' },
      { icon: <IconBug size={20} stroke={1.5} />, label: t.sidebar.items.apiTester, pageKey: 'api-tester' },
    ],
  },
  {
    label: t.sidebar.sections.reports,
    items: [
      { icon: <IconAlertTriangle size={20} stroke={1.5} />, label: t.sidebar.items.integrationAlerts, pageKey: 'alertas' },
    ],
  },
  {
    label: t.sidebar.sections.settings,
    items: [
      { icon: <IconAdjustments size={20} stroke={1.5} />, label: t.sidebar.items.aggregatorConfig, pageKey: 'config-agregador' },
    ],
  },
]

interface SidebarProps {
  activePage: string
  onNavigate: (pageKey: string) => void
  collapsed: boolean
  isMobile: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

const Sidebar = ({ activePage, onNavigate, collapsed, isMobile, mobileOpen, onMobileClose }: SidebarProps) => {
  const { t } = useLanguage()
  const navSections = getNavSections(t)
  const width = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={isMobile ? onMobileClose : undefined}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: isMobile ? DRAWER_WIDTH : width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isMobile ? DRAWER_WIDTH : width,
          boxSizing: 'border-box',
          backgroundColor: '#fff',
          borderRight: '1px solid #e8ecf0',
          overflowX: 'hidden',
          transition: 'width 0.2s',
          height: 'calc(100vh - 56px)',
          position: 'fixed',
          top: '56px',
          left: 0,
          zIndex: isMobile ? 1300 : 1100,
          borderTopRightRadius: isMobile ? 12 : 0,
          boxShadow: isMobile ? '4px 0 20px rgba(15, 23, 42, 0.16)' : 'none',
        },
      }}
    >
      <Box sx={{
        overflowY: 'auto',
        overflowX: 'hidden',
        flexGrow: 1,
        pb: 2,
        height: '100%',
        pt: 0,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        '&::-webkit-scrollbar-thumb': { background: '#d0d5dd', borderRadius: 4 },
        '&::-webkit-scrollbar-thumb:hover': { background: '#9aa3ae' },
      }}>
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
                        pt: isMobile ? '11px' : '10px',
                        pb: isMobile ? '11px' : '10px',
                        mb: '4px',
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
