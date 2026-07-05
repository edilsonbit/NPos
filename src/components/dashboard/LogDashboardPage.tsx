import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FilterListIcon from '@mui/icons-material/FilterList'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import RuleFolderOutlinedIcon from '@mui/icons-material/RuleFolderOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { useMemo, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { auditLogMock, salesForecastTotal, salesLogMock } from '../../data/mocks/logDashboard.mock'
import { useLanguage } from '../../i18n/LanguageContext'

dayjs.locale('pt-br')

const labelsByLanguage = {
  pt: {
    title: 'Log',
    subtitle: 'Dashboard mockado com visão de vendas e auditoria',
    tabs: { sales: 'Vendas', audit: 'Auditoria' },
    controls: 'Controles',
    clear: 'Limpar filtros',
    records: 'registros',
    all: 'Tudo',
    filters: {
      from: 'De',
      to: 'Até',
      group: 'Grupo',
      subgroup: 'SubGrupo',
      manufacturer: 'Fabricante',
      sku: 'SKU',
      channel: 'Canal',
      state: 'UF',
      description: 'Descrição',
      city: 'Cidade',
      country: 'País',
      action: 'Ação',
      status: 'Status',
      user: 'Usuário',
      environment: 'Ambiente',
    },
    sales: {
      totalSales: 'Total de Vendas',
      grossOrders: 'Total Bruto Pedidos',
      orderCount: 'Qtde. Pedidos',
      averageTicket: 'Ticket Médio',
      dailyAverage: 'Média Venda Diária',
      probableRevenue: 'Faturamento Provável',
      periodCoverage: 'Total Faturamento Provável no Período',
      netSales: 'Total Líquido Vendas',
      netMargin: 'Margem Líquida',
      grossChart: 'Total Bruto de Vendas no Período',
      netChart: 'Total Líquido de Vendas no Período',
      detailTable: 'Detalhamento de vendas',
      summaryHeaders: ['Data', 'Qtde. Pedidos', 'Total Bruto Pedidos'],
      detailHeaders: ['Data', 'Grupo', 'SubGrupo', 'Fabricante', 'SKU', 'Canal', 'UF', 'Cidade', 'País', 'Pedidos', 'Bruto', 'Líquido'],
    },
    audit: {
      totalEntries: 'Total de Logs',
      successRate: 'Taxa de Sucesso',
      errors: 'Ocorrências com Erro',
      averageDuration: 'Tempo Médio',
      entriesByDay: 'Eventos por dia',
      statusBreakdown: 'Status por dia',
      actionsByType: 'Ações por tipo',
      usersByVolume: 'Volume por usuário',
      detailTable: 'Eventos detalhados',
      detailHeaders: ['Data/Hora', 'Módulo', 'Ação', 'Entidade', 'Documento', 'Usuário', 'Canal', 'Origem', 'Ambiente', 'IP', 'Status', 'Duração', 'Mensagem'],
    },
  },
  en: {
    title: 'Log',
    subtitle: 'Mock dashboard with sales and audit views',
    tabs: { sales: 'Sales', audit: 'Audit' },
    controls: 'Controls',
    clear: 'Clear filters',
    records: 'records',
    all: 'All',
    filters: {
      from: 'From',
      to: 'To',
      group: 'Group',
      subgroup: 'Subgroup',
      manufacturer: 'Manufacturer',
      sku: 'SKU',
      channel: 'Channel',
      state: 'State',
      description: 'Description',
      city: 'City',
      country: 'Country',
      action: 'Action',
      status: 'Status',
      user: 'User',
      environment: 'Environment',
    },
    sales: {
      totalSales: 'Total Sales',
      grossOrders: 'Gross Orders',
      orderCount: 'Order Count',
      averageTicket: 'Average Ticket',
      dailyAverage: 'Daily Average',
      probableRevenue: 'Probable Revenue',
      periodCoverage: 'Period Revenue Coverage',
      netSales: 'Net Sales',
      netMargin: 'Net Margin',
      grossChart: 'Gross Sales in Period',
      netChart: 'Net Sales in Period',
      detailTable: 'Sales details',
      summaryHeaders: ['Date', 'Order Count', 'Gross Orders'],
      detailHeaders: ['Date', 'Group', 'Subgroup', 'Manufacturer', 'SKU', 'Channel', 'State', 'City', 'Country', 'Orders', 'Gross', 'Net'],
    },
    audit: {
      totalEntries: 'Total Logs',
      successRate: 'Success Rate',
      errors: 'Errors',
      averageDuration: 'Average Time',
      entriesByDay: 'Events by day',
      statusBreakdown: 'Status by day',
      actionsByType: 'Actions by type',
      usersByVolume: 'Volume by user',
      detailTable: 'Detailed events',
      detailHeaders: ['Date/Time', 'Module', 'Action', 'Entity', 'Document', 'User', 'Channel', 'Source', 'Environment', 'IP', 'Status', 'Duration', 'Message'],
    },
  },
  es: {
    title: 'Log',
    subtitle: 'Dashboard simulado con vistas de ventas y auditoría',
    tabs: { sales: 'Ventas', audit: 'Auditoría' },
    controls: 'Controles',
    clear: 'Limpiar filtros',
    records: 'registros',
    all: 'Todo',
    filters: {
      from: 'Desde',
      to: 'Hasta',
      group: 'Grupo',
      subgroup: 'SubGrupo',
      manufacturer: 'Fabricante',
      sku: 'SKU',
      channel: 'Canal',
      state: 'UF',
      description: 'Descripción',
      city: 'Ciudad',
      country: 'País',
      action: 'Acción',
      status: 'Estado',
      user: 'Usuario',
      environment: 'Ambiente',
    },
    sales: {
      totalSales: 'Total de Ventas',
      grossOrders: 'Total Bruto Pedidos',
      orderCount: 'Cant. Pedidos',
      averageTicket: 'Ticket Promedio',
      dailyAverage: 'Promedio Diario',
      probableRevenue: 'Facturación Probable',
      periodCoverage: 'Cobertura de Facturación del Período',
      netSales: 'Ventas Netas',
      netMargin: 'Margen Neto',
      grossChart: 'Ventas Brutas del Período',
      netChart: 'Ventas Netas del Período',
      detailTable: 'Detalle de ventas',
      summaryHeaders: ['Fecha', 'Pedidos', 'Bruto'],
      detailHeaders: ['Fecha', 'Grupo', 'SubGrupo', 'Fabricante', 'SKU', 'Canal', 'UF', 'Ciudad', 'País', 'Pedidos', 'Bruto', 'Neto'],
    },
    audit: {
      totalEntries: 'Total de Logs',
      successRate: 'Tasa de Éxito',
      errors: 'Errores',
      averageDuration: 'Tiempo Promedio',
      entriesByDay: 'Eventos por día',
      statusBreakdown: 'Estado por día',
      actionsByType: 'Acciones por tipo',
      usersByVolume: 'Volumen por usuario',
      detailTable: 'Eventos detallados',
      detailHeaders: ['Fecha/Hora', 'Módulo', 'Acción', 'Entidad', 'Documento', 'Usuario', 'Canal', 'Origen', 'Ambiente', 'IP', 'Estado', 'Duración', 'Mensaje'],
    },
  },
}

type SalesFilters = {
  dateFrom: string
  dateTo: string
  group: string
  subgroup: string
  manufacturer: string
  sku: string
  channel: string
  state: string
  description: string
  city: string
  country: string
}

type AuditFilters = {
  dateFrom: string
  dateTo: string
  action: string
  status: string
  user: string
  environment: string
}

const defaultSalesFilters: SalesFilters = {
  dateFrom: '2023-01-02',
  dateTo: '2023-01-31',
  group: 'Tudo',
  subgroup: 'Tudo',
  manufacturer: 'Tudo',
  sku: 'Tudo',
  channel: 'Tudo',
  state: 'Tudo',
  description: 'Tudo',
  city: 'Tudo',
  country: 'Tudo',
}

const defaultAuditFilters: AuditFilters = {
  dateFrom: '2026-07-01',
  dateTo: '2026-07-05',
  action: 'Tudo',
  status: 'Tudo',
  user: 'Tudo',
  environment: 'Tudo',
}

function fmtBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtNumber(value: number) {
  return value.toLocaleString('pt-BR')
}

function fmtPercent(value: number) {
  return `${value.toFixed(2)}%`
}

function fmtDuration(value: number) {
  return `${Math.round(value)} ms`
}

function withAll(options: string[], allLabel: string) {
  return [allLabel, ...Array.from(new Set(options))]
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid #e8ecf0', borderRadius: 2.5, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a2e35' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color, mt: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: '#667085', mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: 2, backgroundColor: `${color}14`, color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid #e8ecf0', borderRadius: 2.5, boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a2e35', mb: 1.5 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  )
}

export function LogDashboardPage() {
  const { language } = useLanguage()
  const copy = labelsByLanguage[language]
  const [tab, setTab] = useState(0)
  const [salesFilters, setSalesFilters] = useState(defaultSalesFilters)
  const [auditFilters, setAuditFilters] = useState(defaultAuditFilters)

  const salesOptions = useMemo(
    () => ({
      groups: withAll(salesLogMock.map((row) => row.group), copy.all),
      subgroups: withAll(salesLogMock.map((row) => row.subgroup), copy.all),
      manufacturers: withAll(salesLogMock.map((row) => row.manufacturer), copy.all),
      skus: withAll(salesLogMock.map((row) => row.sku), copy.all),
      channels: withAll(salesLogMock.map((row) => row.channel), copy.all),
      states: withAll(salesLogMock.map((row) => row.state), copy.all),
      descriptions: withAll(salesLogMock.map((row) => row.description), copy.all),
      cities: withAll(salesLogMock.map((row) => row.city), copy.all),
      countries: withAll(salesLogMock.map((row) => row.country), copy.all),
    }),
    [copy.all],
  )

  const filteredSales = useMemo(() => {
    return salesLogMock.filter((row) => {
      const rowDate = dayjs(row.date)
      return (
        (!salesFilters.dateFrom || !rowDate.isBefore(dayjs(salesFilters.dateFrom), 'day')) &&
        (!salesFilters.dateTo || !rowDate.isAfter(dayjs(salesFilters.dateTo), 'day')) &&
        (salesFilters.group === copy.all || row.group === salesFilters.group) &&
        (salesFilters.subgroup === copy.all || row.subgroup === salesFilters.subgroup) &&
        (salesFilters.manufacturer === copy.all || row.manufacturer === salesFilters.manufacturer) &&
        (salesFilters.sku === copy.all || row.sku === salesFilters.sku) &&
        (salesFilters.channel === copy.all || row.channel === salesFilters.channel) &&
        (salesFilters.state === copy.all || row.state === salesFilters.state) &&
        (salesFilters.description === copy.all || row.description === salesFilters.description) &&
        (salesFilters.city === copy.all || row.city === salesFilters.city) &&
        (salesFilters.country === copy.all || row.country === salesFilters.country)
      )
    })
  }, [copy.all, salesFilters])

  const salesTotals = useMemo(() => {
    const grossRevenue = filteredSales.reduce((total, row) => total + row.grossRevenue, 0)
    const netRevenue = filteredSales.reduce((total, row) => total + row.netRevenue, 0)
    const orderCount = filteredSales.reduce((total, row) => total + row.orderCount, 0)
    const averageTicket = orderCount ? grossRevenue / orderCount : 0
    const rangeStart = salesFilters.dateFrom ? dayjs(salesFilters.dateFrom) : dayjs(filteredSales[0]?.date)
    const rangeEnd = salesFilters.dateTo ? dayjs(salesFilters.dateTo) : dayjs(filteredSales.at(-1)?.date)
    const dayCount = rangeStart.isValid() && rangeEnd.isValid() ? Math.max(rangeEnd.diff(rangeStart, 'day') + 1, 1) : 1
    const dailyAverage = grossRevenue / dayCount
    const probableCoverage = salesForecastTotal ? (grossRevenue / salesForecastTotal) * 100 : 0
    const netMargin = grossRevenue ? (netRevenue / grossRevenue) * 100 : 0
    return {
      grossRevenue,
      netRevenue,
      orderCount,
      averageTicket,
      dailyAverage,
      probableCoverage,
      netMargin,
    }
  }, [filteredSales, salesFilters.dateFrom, salesFilters.dateTo])

  const salesSeries = useMemo(
    () => ({
      categories: filteredSales.map((row) => dayjs(row.date).format('DD/MM/YYYY')),
      grossRevenue: filteredSales.map((row) => Number(row.grossRevenue.toFixed(2))),
      netRevenue: filteredSales.map((row) => Number(row.netRevenue.toFixed(2))),
      orders: filteredSales.map((row) => row.orderCount),
    }),
    [filteredSales],
  )

  const auditOptions = useMemo(
    () => ({
      actions: withAll(auditLogMock.map((row) => row.action), copy.all),
      statuses: withAll(auditLogMock.map((row) => row.status), copy.all),
      users: withAll(auditLogMock.map((row) => row.user), copy.all),
      environments: withAll(auditLogMock.map((row) => row.environment), copy.all),
    }),
    [copy.all],
  )

  const filteredAudit = useMemo(() => {
    return auditLogMock.filter((row) => {
      const rowDate = dayjs(row.timestamp)
      return (
        (!auditFilters.dateFrom || !rowDate.isBefore(dayjs(auditFilters.dateFrom), 'day')) &&
        (!auditFilters.dateTo || !rowDate.isAfter(dayjs(auditFilters.dateTo).endOf('day'))) &&
        (auditFilters.action === copy.all || row.action === auditFilters.action) &&
        (auditFilters.status === copy.all || row.status === auditFilters.status) &&
        (auditFilters.user === copy.all || row.user === auditFilters.user) &&
        (auditFilters.environment === copy.all || row.environment === auditFilters.environment)
      )
    })
  }, [auditFilters, copy.all])

  const auditMetrics = useMemo(() => {
    const successCount = filteredAudit.filter((row) => row.status === 'Sucesso').length
    const errorCount = filteredAudit.filter((row) => row.status === 'Erro').length
    const averageDuration = filteredAudit.length
      ? filteredAudit.reduce((total, row) => total + row.durationMs, 0) / filteredAudit.length
      : 0
    const successRate = filteredAudit.length ? (successCount / filteredAudit.length) * 100 : 0
    return { successCount, errorCount, averageDuration, successRate }
  }, [filteredAudit])

  const auditCharts = useMemo(() => {
    const dailyMap: Record<string, { success: number; error: number; processing: number }> = {}
    const actionMap: Record<string, number> = {}
    const userMap: Record<string, number> = {}

    filteredAudit.forEach((row) => {
      const key = dayjs(row.timestamp).format('DD/MM')
      dailyMap[key] = dailyMap[key] ?? { success: 0, error: 0, processing: 0 }
      if (row.status === 'Sucesso') dailyMap[key].success += 1
      if (row.status === 'Erro') dailyMap[key].error += 1
      if (row.status === 'Processando') dailyMap[key].processing += 1
      actionMap[row.action] = (actionMap[row.action] ?? 0) + 1
      userMap[row.user] = (userMap[row.user] ?? 0) + 1
    })

    const days = Object.keys(dailyMap)
    return {
      days,
      totalByDay: days.map((day) => dailyMap[day].success + dailyMap[day].error + dailyMap[day].processing),
      successByDay: days.map((day) => dailyMap[day].success),
      errorByDay: days.map((day) => dailyMap[day].error),
      processingByDay: days.map((day) => dailyMap[day].processing),
      actionLabels: Object.keys(actionMap),
      actionValues: Object.values(actionMap),
      userLabels: Object.keys(userMap),
      userValues: Object.values(userMap),
    }
  }, [filteredAudit])

  const salesBarOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '52%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: salesSeries.categories },
    yaxis: { labels: { formatter: (value) => `R$ ${(value / 1000).toFixed(0)}k` } },
    tooltip: { y: { formatter: (value) => fmtBRL(value) } },
    grid: { borderColor: '#edf2f7', strokeDashArray: 4 },
    colors: ['#2bb300'],
  }

  const netBarOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '52%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: salesSeries.categories },
    yaxis: { labels: { formatter: (value) => `R$ ${(value / 1000).toFixed(0)}k` } },
    tooltip: { y: { formatter: (value) => fmtBRL(value) } },
    grid: { borderColor: '#edf2f7', strokeDashArray: 4 },
    colors: ['#8ed0e6'],
  }

  const gaugeOptions = (color: string, max = 100): ApexOptions => ({
    chart: { type: 'radialBar', sparkline: { enabled: true }, fontFamily: 'inherit' },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: '58%' },
        track: { background: '#e5e7eb', strokeWidth: '100%' },
        dataLabels: {
          name: { show: false },
          value: { offsetY: -2, fontSize: '26px', fontWeight: 700, formatter: (value) => `${value.toFixed(2)}%` },
        },
      },
    },
    colors: [color],
    stroke: { lineCap: 'round' },
    fill: {
      type: 'gradient',
      gradient: { shade: 'light', type: 'horizontal', gradientToColors: [color], stops: [0, max] },
    },
  })

  const auditLineOptions: ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
    stroke: { curve: 'smooth', width: 2.5 },
    dataLabels: { enabled: false },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 90, 100] } },
    xaxis: { categories: auditCharts.days },
    colors: ['#1f78ff'],
    grid: { borderColor: '#edf2f7', strokeDashArray: 4 },
  }

  const auditStatusOptions: ApexOptions = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '48%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: auditCharts.days },
    colors: ['#2e7d32', '#d32f2f', '#f9a825'],
    legend: { position: 'top', horizontalAlign: 'left' },
    grid: { borderColor: '#edf2f7', strokeDashArray: 4 },
  }

  const auditActionOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: { categories: auditCharts.actionLabels },
    colors: ['#0d3b45'],
    grid: { borderColor: '#edf2f7', strokeDashArray: 4 },
  }

  const auditUserOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: auditCharts.userLabels,
    legend: { position: 'bottom' },
    colors: ['#1f78ff', '#7c3aed', '#00a76f', '#fb8c00'],
    dataLabels: { enabled: true },
    plotOptions: { pie: { donut: { size: '58%' } } },
  }

  return (
    <Box sx={{ minHeight: '100%' }}>
      <Card elevation={0} sx={{ border: '1px solid #e8ecf0', borderRadius: 2.5, overflow: 'hidden', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
        <Box sx={{ px: { xs: 1.5, md: 2.5 }, pt: 2.2, pb: 0, backgroundColor: '#fcfdff' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0d3b45' }}>
            {copy.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {copy.subtitle}
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, value: number) => setTab(value)}
            sx={{ borderBottom: '1px solid #e8ecf0', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 38 } }}
          >
            <Tab label={copy.tabs.sales} />
            <Tab label={copy.tabs.audit} />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 2 } }}>
          {tab === 0 ? (
            <Stack spacing={2}>
              <Accordion defaultExpanded disableGutters elevation={0} sx={{ border: '1px solid #e8ecf0', borderRadius: '16px !important', overflow: 'hidden' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <FilterListIcon sx={{ color: '#0d3b45' }} />
                    <Typography sx={{ fontWeight: 700 }}>{copy.controls}</Typography>
                    <Chip label={`${filteredSales.length} ${copy.records}`} size="small" sx={{ backgroundColor: '#e8f4ff', color: '#1565c0', fontWeight: 600 }} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: '#fafcff' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 1.5 }}>
                    <TextField
                      label={copy.filters.from}
                      size="small"
                      type="date"
                      value={salesFilters.dateFrom}
                      onChange={(event) => setSalesFilters((current) => ({ ...current, dateFrom: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label={copy.filters.to}
                      size="small"
                      type="date"
                      value={salesFilters.dateTo}
                      onChange={(event) => setSalesFilters((current) => ({ ...current, dateTo: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField select label={copy.filters.group} size="small" value={salesFilters.group} onChange={(event) => setSalesFilters((current) => ({ ...current, group: event.target.value }))}>
                      {salesOptions.groups.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.subgroup} size="small" value={salesFilters.subgroup} onChange={(event) => setSalesFilters((current) => ({ ...current, subgroup: event.target.value }))}>
                      {salesOptions.subgroups.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.manufacturer} size="small" value={salesFilters.manufacturer} onChange={(event) => setSalesFilters((current) => ({ ...current, manufacturer: event.target.value }))}>
                      {salesOptions.manufacturers.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.sku} size="small" value={salesFilters.sku} onChange={(event) => setSalesFilters((current) => ({ ...current, sku: event.target.value }))}>
                      {salesOptions.skus.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.channel} size="small" value={salesFilters.channel} onChange={(event) => setSalesFilters((current) => ({ ...current, channel: event.target.value }))}>
                      {salesOptions.channels.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.state} size="small" value={salesFilters.state} onChange={(event) => setSalesFilters((current) => ({ ...current, state: event.target.value }))}>
                      {salesOptions.states.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.description} size="small" value={salesFilters.description} onChange={(event) => setSalesFilters((current) => ({ ...current, description: event.target.value }))}>
                      {salesOptions.descriptions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.city} size="small" value={salesFilters.city} onChange={(event) => setSalesFilters((current) => ({ ...current, city: event.target.value }))}>
                      {salesOptions.cities.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.country} size="small" value={salesFilters.country} onChange={(event) => setSalesFilters((current) => ({ ...current, country: event.target.value }))}>
                      {salesOptions.countries.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField
                      size="small"
                      value={copy.clear}
                      slotProps={{ input: { readOnly: true } }}
                      onClick={() => setSalesFilters(defaultSalesFilters)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          cursor: 'pointer',
                          backgroundColor: '#fff5f5',
                          color: '#c62828',
                          fontWeight: 700,
                        },
                      }}
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <ChartCard title={copy.sales.totalSales}>
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            {copy.sales.summaryHeaders.map((header) => (
                              <TableCell key={header} sx={{ fontWeight: 700, backgroundColor: '#fafbfc', whiteSpace: 'nowrap' }}>
                                {header}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredSales.map((row) => (
                            <TableRow key={`${row.date}-${row.sku}`} hover>
                              <TableCell>{dayjs(row.date).format('DD/MM/YYYY')}</TableCell>
                              <TableCell>{fmtNumber(row.orderCount)}</TableCell>
                              <TableCell>{fmtBRL(row.grossRevenue)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>{copy.all}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{fmtNumber(salesTotals.orderCount)}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{fmtBRL(salesTotals.grossRevenue)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </ChartCard>
                </Grid>
                <Grid size={{ xs: 12, md: 9 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                      <MetricCard title={copy.sales.grossOrders} value={fmtBRL(salesTotals.grossRevenue)} icon={<AttachMoneyOutlinedIcon />} color="#0d3b45" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                      <MetricCard title={copy.sales.orderCount} value={fmtNumber(salesTotals.orderCount)} icon={<ReceiptLongOutlinedIcon />} color="#2bb300" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                      <MetricCard title={copy.sales.averageTicket} value={fmtBRL(salesTotals.averageTicket)} icon={<TrendingUpIcon />} color="#ef6c00" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                      <MetricCard title={copy.sales.netSales} value={fmtBRL(salesTotals.netRevenue)} icon={<AssessmentOutlinedIcon />} color="#2bb300" />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <MetricCard title={copy.sales.dailyAverage} value={fmtBRL(salesTotals.dailyAverage)} subtitle={`${fmtNumber(filteredSales.length)} ${copy.records}`} icon={<InsightsOutlinedIcon />} color="#0d3b45" />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <MetricCard title={copy.sales.probableRevenue} value={fmtBRL(salesForecastTotal)} subtitle={`${copy.sales.periodCoverage}: ${fmtPercent(salesTotals.probableCoverage)}`} icon={<RuleFolderOutlinedIcon />} color="#1565c0" />
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <ChartCard title={copy.sales.periodCoverage}>
                        <ReactApexChart
                          type="radialBar"
                          height={270}
                          options={gaugeOptions('#2bb300')}
                          series={[Number(salesTotals.probableCoverage.toFixed(2))]}
                        />
                      </ChartCard>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <ChartCard title={copy.sales.netMargin}>
                        <ReactApexChart
                          type="radialBar"
                          height={270}
                          options={gaugeOptions('#2bb300')}
                          series={[Number(salesTotals.netMargin.toFixed(2))]}
                        />
                      </ChartCard>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ChartCard title={copy.sales.grossChart}>
                    <ReactApexChart
                      type="bar"
                      height={320}
                      options={salesBarOptions}
                      series={[{ name: copy.sales.grossOrders, data: salesSeries.grossRevenue }]}
                    />
                  </ChartCard>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ChartCard title={copy.sales.netChart}>
                    <ReactApexChart
                      type="bar"
                      height={320}
                      options={netBarOptions}
                      series={[{ name: copy.sales.netSales, data: salesSeries.netRevenue }]}
                    />
                  </ChartCard>
                </Grid>
              </Grid>

              <ChartCard title={copy.sales.detailTable}>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 1220 }}>
                    <TableHead>
                      <TableRow>
                        {copy.sales.detailHeaders.map((header) => (
                          <TableCell key={header} sx={{ fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: '#fafbfc' }}>
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredSales.map((row) => (
                        <TableRow key={`${row.date}-${row.sku}-detail`} hover>
                          <TableCell>{dayjs(row.date).format('DD/MM/YYYY')}</TableCell>
                          <TableCell>{row.group}</TableCell>
                          <TableCell>{row.subgroup}</TableCell>
                          <TableCell>{row.manufacturer}</TableCell>
                          <TableCell>{row.sku}</TableCell>
                          <TableCell>{row.channel}</TableCell>
                          <TableCell>{row.state}</TableCell>
                          <TableCell>{row.city}</TableCell>
                          <TableCell>{row.country}</TableCell>
                          <TableCell>{fmtNumber(row.orderCount)}</TableCell>
                          <TableCell>{fmtBRL(row.grossRevenue)}</TableCell>
                          <TableCell>{fmtBRL(row.netRevenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </ChartCard>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Accordion defaultExpanded disableGutters elevation={0} sx={{ border: '1px solid #e8ecf0', borderRadius: '16px !important', overflow: 'hidden' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <FilterListIcon sx={{ color: '#0d3b45' }} />
                    <Typography sx={{ fontWeight: 700 }}>{copy.controls}</Typography>
                    <Chip label={`${filteredAudit.length} ${copy.records}`} size="small" sx={{ backgroundColor: '#e8f4ff', color: '#1565c0', fontWeight: 600 }} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ backgroundColor: '#fafcff' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5 }}>
                    <TextField
                      label={copy.filters.from}
                      size="small"
                      type="date"
                      value={auditFilters.dateFrom}
                      onChange={(event) => setAuditFilters((current) => ({ ...current, dateFrom: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label={copy.filters.to}
                      size="small"
                      type="date"
                      value={auditFilters.dateTo}
                      onChange={(event) => setAuditFilters((current) => ({ ...current, dateTo: event.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField select label={copy.filters.action} size="small" value={auditFilters.action} onChange={(event) => setAuditFilters((current) => ({ ...current, action: event.target.value }))}>
                      {auditOptions.actions.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.status} size="small" value={auditFilters.status} onChange={(event) => setAuditFilters((current) => ({ ...current, status: event.target.value }))}>
                      {auditOptions.statuses.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.user} size="small" value={auditFilters.user} onChange={(event) => setAuditFilters((current) => ({ ...current, user: event.target.value }))}>
                      {auditOptions.users.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                    <TextField select label={copy.filters.environment} size="small" value={auditFilters.environment} onChange={(event) => setAuditFilters((current) => ({ ...current, environment: event.target.value }))}>
                      {auditOptions.environments.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                    </TextField>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <MetricCard title={copy.audit.totalEntries} value={fmtNumber(filteredAudit.length)} icon={<ReceiptLongOutlinedIcon />} color="#0d3b45" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <MetricCard title={copy.audit.successRate} value={fmtPercent(auditMetrics.successRate)} subtitle={`${fmtNumber(auditMetrics.successCount)} sucesso(s)`} icon={<TrendingUpIcon />} color="#2e7d32" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <MetricCard title={copy.audit.errors} value={fmtNumber(auditMetrics.errorCount)} icon={<HubOutlinedIcon />} color="#d32f2f" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <MetricCard title={copy.audit.averageDuration} value={fmtDuration(auditMetrics.averageDuration)} icon={<AssessmentOutlinedIcon />} color="#1565c0" />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ChartCard title={copy.audit.entriesByDay}>
                    <ReactApexChart
                      type="area"
                      height={300}
                      options={auditLineOptions}
                      series={[{ name: copy.audit.totalEntries, data: auditCharts.totalByDay }]}
                    />
                  </ChartCard>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ChartCard title={copy.audit.statusBreakdown}>
                    <ReactApexChart
                      type="bar"
                      height={300}
                      options={auditStatusOptions}
                      series={[
                        { name: 'Sucesso', data: auditCharts.successByDay },
                        { name: 'Erro', data: auditCharts.errorByDay },
                        { name: 'Processando', data: auditCharts.processingByDay },
                      ]}
                    />
                  </ChartCard>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ChartCard title={copy.audit.actionsByType}>
                    <ReactApexChart
                      type="bar"
                      height={320}
                      options={auditActionOptions}
                      series={[{ name: copy.audit.totalEntries, data: auditCharts.actionValues }]}
                    />
                  </ChartCard>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ChartCard title={copy.audit.usersByVolume}>
                    <ReactApexChart
                      type="donut"
                      height={320}
                      options={auditUserOptions}
                      series={auditCharts.userValues}
                    />
                  </ChartCard>
                </Grid>
              </Grid>

              <ChartCard title={copy.audit.detailTable}>
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 1640 }}>
                    <TableHead>
                      <TableRow>
                        {copy.audit.detailHeaders.map((header) => (
                          <TableCell key={header} sx={{ fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: '#fafbfc' }}>
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAudit.map((row) => (
                        <TableRow key={`${row.timestamp}-${row.document}`} hover>
                          <TableCell>{dayjs(row.timestamp).format('DD/MM/YYYY HH:mm:ss')}</TableCell>
                          <TableCell>{row.module}</TableCell>
                          <TableCell>{row.action}</TableCell>
                          <TableCell>{row.entity}</TableCell>
                          <TableCell>{row.document}</TableCell>
                          <TableCell>{row.user}</TableCell>
                          <TableCell>{row.channel}</TableCell>
                          <TableCell>{row.source}</TableCell>
                          <TableCell>{row.environment}</TableCell>
                          <TableCell>{row.ip}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={row.status}
                              sx={{
                                fontWeight: 700,
                                backgroundColor:
                                  row.status === 'Sucesso' ? '#e8f5e9' : row.status === 'Erro' ? '#ffebee' : '#fff8e1',
                                color:
                                  row.status === 'Sucesso' ? '#2e7d32' : row.status === 'Erro' ? '#c62828' : '#ef6c00',
                              }}
                            />
                          </TableCell>
                          <TableCell>{fmtDuration(row.durationMs)}</TableCell>
                          <TableCell sx={{ minWidth: 260 }}>{row.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </ChartCard>
            </Stack>
          )}
        </Box>
      </Card>
    </Box>
  )
}
