import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CancelIcon from '@mui/icons-material/Cancel'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import FilterListIcon from '@mui/icons-material/FilterList'
import { Autocomplete, Box, Button, Card, CardContent, Chip, Grid, Stack, TextField, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { type Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import { useMemo, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { Coupon } from '../../domain/models'
import { useLanguage } from '../../i18n/LanguageContext'

interface Props {
  coupons: Coupon[]
}

const PALETTE = ['#0d3b45', '#f08f4f', '#3db8a4', '#e85d6a', '#6c63ff', '#f7c948', '#2ecc71']

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getSeriesIndex(opts?: { seriesIndex: number }) {
  return opts?.seriesIndex ?? 0
}

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────
interface KpiProps {
  label: string
  value: string
  detailPrimary?: string
  detailSecondary?: string
  detailPrimaryLabel?: string
  detailSecondaryLabel?: string
  color: string
  icon: React.ReactNode
}
function KpiCard({ label, value, detailPrimary, detailSecondary, detailPrimaryLabel, detailSecondaryLabel, color, icon }: KpiProps) {
  const renderDetail = (detail?: string, forcedLabel?: string) => {
    if (!detail) return null
    const detailLabel = forcedLabel ?? detail.split(': ')[0]
    const detailValue = forcedLabel ? detail : detail.split(': ').slice(1).join(': ') || detailLabel

    return (
      <Box
        sx={{
          minHeight: 72,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: 0.25,
          p: 1.3,
          borderRadius: 2.2,
          backgroundColor: '#ffffff',
          border: '1px solid #e4eaf1',
          boxShadow: '0 1px 4px rgba(15,23,42,0.03)',
        }}
      >
        <Typography variant="caption" sx={{ color: '#667085', fontWeight: 700, lineHeight: 1.05, textTransform: 'uppercase', letterSpacing: 0.35 }}>
          {detailLabel}
        </Typography>
        <Typography variant="body2" sx={{ color: '#1f2937', fontWeight: 800, lineHeight: 1.1 }}>
          {detailValue || detailLabel}
        </Typography>
      </Box>
    )
  }

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid #e1e8f0',
        borderRadius: 3,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
        background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 5,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.8, md: 2.2 }, pt: { xs: 2.4, md: 2.6 }, position: 'relative' }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ display: 'block', color: '#6b7280', fontWeight: 700, lineHeight: 1.1, letterSpacing: 0.8 }}>
                {label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color, lineHeight: 1.05, mt: 0.25 }}>
                {value}
              </Typography>
            </Box>
            <Box
              sx={{
                width: { xs: 40, md: 44 },
                height: { xs: 40, md: 44 },
                borderRadius: 2.25,
                display: 'grid',
                placeItems: 'center',
                backgroundColor: `${color}14`,
                border: `1px solid ${color}22`,
                color,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          </Stack>

          {(detailPrimary || detailSecondary) && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 1,
              }}
            >
              {renderDetail(detailPrimary, detailPrimaryLabel)}
              {renderDetail(detailSecondary, detailSecondaryLabel)}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// Chart Card wrapper
// ─────────────────────────────────────────────
function ChartCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e8ecf0', borderRadius: 2.5, height: '100%', boxShadow: '0 4px 16px rgba(15,23,42,0.04)' }}>
      <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 0.75 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a2e35' }}>
            {title}
          </Typography>
          {badge && <Chip label={badge} size="small" sx={{ backgroundColor: '#f0f4f8', fontWeight: 600 }} />}
        </Stack>
        {children}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export function DashboardPage({ coupons }: Props) {
  const { t } = useLanguage()
  const stores = useMemo(() => [...new Set(coupons.map((c) => c.storeId))].sort(), [coupons])
  const defaultDateFrom = useMemo(() => dayjs().startOf('month').startOf('day'), [])
  const defaultDateTo = useMemo(() => dayjs().startOf('day'), [])
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(defaultDateFrom)
  const [dateTo, setDateTo] = useState<Dayjs | null>(defaultDateTo)
  const [storeId, setStoreId] = useState<string | null>(null)

  const hasCustomPeriod = useMemo(() => {
    if (!dateFrom || !dateTo) return true
    return !dateFrom.isSame(defaultDateFrom, 'day') || !dateTo.isSame(defaultDateTo, 'day')
  }, [dateFrom, dateTo, defaultDateFrom, defaultDateTo])

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const d = dayjs(c.createdAt)
      if (storeId && c.storeId !== storeId) return false
      if (dateFrom && d.isBefore(dateFrom.startOf('day'))) return false
      if (dateTo && d.isAfter(dateTo.endOf('day'))) return false
      return true
    })
  }, [coupons, dateFrom, dateTo, storeId])

  // 'agrupado' = foi autorizado e depois agregado; conta como receita
  const authorized = useMemo(
    () => filteredCoupons.filter((c) => c.status === 'autorizado' || (c.status as string) === 'agrupado'),
    [filteredCoupons],
  )
  const cancelled = useMemo(() => filteredCoupons.filter((c) => c.status === 'cancelado'), [filteredCoupons])

  const totalRevenue = useMemo(() => authorized.reduce((s, c) => s + c.amount, 0), [authorized])
  const cancelledRevenue = useMemo(() => cancelled.reduce((s, c) => s + c.amount, 0), [cancelled])
  const grossRevenue = totalRevenue + cancelledRevenue
  const avgTicket = authorized.length ? totalRevenue / authorized.length : 0
  const avgCancelledTicket = cancelled.length ? cancelledRevenue / cancelled.length : 0
  const cancelRate = filteredCoupons.length ? (cancelled.length / filteredCoupons.length) * 100 : 0

  // ── Faturamento por dia (linha) ───────────────
  const revenueByDay = useMemo(() => {
    const map: Record<string, number> = {}
    authorized.forEach((c) => {
      const d = dayjs(c.createdAt).format('DD/MM')
      map[d] = (map[d] ?? 0) + c.amount
    })
    const sorted = Object.entries(map).sort(([a], [b]) => {
      const [da, ma] = a.split('/').map(Number)
      const [db, mb] = b.split('/').map(Number)
      return ma !== mb ? ma - mb : da - db
    })
    return { categories: sorted.map(([d]) => d), values: sorted.map(([, v]) => +v.toFixed(2)) }
  }, [authorized])

  // ── Meios de pagamento (donut) ────────────────
  const byPayment = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {}
    authorized.forEach((c) => {
      map[c.paymentMethod] = map[c.paymentMethod] ?? { amount: 0, count: 0 }
      map[c.paymentMethod].amount += c.amount
      map[c.paymentMethod].count += 1
    })
    const labels = Object.keys(map)
    const values = Object.values(map).map((v) => +v.amount.toFixed(2))
    const meta = labels.map((label) => ({ label, count: map[label].count, amount: +map[label].amount.toFixed(2) }))
    const totalCount = meta.reduce((acc, item) => acc + item.count, 0)
    const totalAmount = meta.reduce((acc, item) => acc + item.amount, 0)
    return { labels, values, meta, totalCount, totalAmount }
  }, [authorized])

  // ── Faturamento por loja (bar horizontal) ─────
  const byStore = useMemo(() => {
    const map: Record<string, number> = {}
    authorized.forEach((c) => {
      map[c.storeId] = (map[c.storeId] ?? 0) + c.amount
    })
    const sorted = Object.entries(map).sort(([, a], [, b]) => b - a)
    return { categories: sorted.map(([s]) => s), values: sorted.map(([, v]) => +v.toFixed(2)) }
  }, [authorized])

  // ── Adquirentes (donut) ────────────────────────
  const byAcquirer = useMemo(() => {
    const map: Record<string, { amount: number; count: number }> = {}
    authorized.forEach((c) => {
      map[c.acquirer] = map[c.acquirer] ?? { amount: 0, count: 0 }
      map[c.acquirer].count += 1
      map[c.acquirer].amount += c.amount
    })
    const labels = Object.keys(map)
    const values = labels.map((label) => map[label].count)
    const meta = labels.map((label) => ({ label, count: map[label].count, amount: +map[label].amount.toFixed(2) }))
    const totalCount = meta.reduce((acc, item) => acc + item.count, 0)
    const totalAmount = meta.reduce((acc, item) => acc + item.amount, 0)
    return { labels, values, meta, totalCount, totalAmount }
  }, [authorized])

  // ── Top 8 produtos por receita (bar) ──────────
  const topProducts = useMemo(() => {
    const map: Record<string, number> = {}
    authorized.forEach((c) => {
      const name = c.productName.length > 20 ? c.productName.slice(0, 20) + '…' : c.productName
      map[name] = (map[name] ?? 0) + c.amount
    })
    const sorted = Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 8)
    return { categories: sorted.map(([n]) => n), values: sorted.map(([, v]) => +v.toFixed(2)) }
  }, [authorized])

  // ── Status dos cupons (donut com 2 fatias) ────
  const statusCounts = useMemo(() => {
    const aut = filteredCoupons.filter((c) => c.status === 'autorizado' || (c.status as string) === 'agrupado').length
    const can = cancelled.length
    const authorizedAmount = filteredCoupons
      .filter((c) => c.status === 'autorizado' || (c.status as string) === 'agrupado')
      .reduce((acc, c) => acc + c.amount, 0)
    const cancelledAmount = cancelled.reduce((acc, c) => acc + c.amount, 0)
    const meta = [
      { label: 'Autorizado', count: aut, amount: +authorizedAmount.toFixed(2) },
      { label: 'Cancelado', count: can, amount: +cancelledAmount.toFixed(2) },
    ]
    const totalCount = meta.reduce((acc, item) => acc + item.count, 0)
    const totalAmount = meta.reduce((acc, item) => acc + item.amount, 0)
    return { aut, can, meta, totalCount, totalAmount }
  }, [filteredCoupons, cancelled])

  // ─────────────────────────────────────────────
  // Chart options
  // ─────────────────────────────────────────────
  const lineOpts: ApexOptions = {
    chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit', zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 90, 100] },
    },
    colors: [PALETTE[0]],
    xaxis: { categories: revenueByDay.categories, labels: { style: { fontSize: '11px' } }, tickAmount: 8 },
    yaxis: {
      labels: {
        formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k`,
        style: { fontSize: '11px' },
      },
    },
    tooltip: { y: { formatter: (v) => fmtBRL(v) } },
    grid: { borderColor: '#f0f0f0', strokeDashArray: 4 },
  }

  const donutPaymentOpts: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: byPayment.labels,
    colors: PALETTE,
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: {
      style: { fontSize: '12px' },
      formatter: (value, opts) => {
        const item = byPayment.meta[getSeriesIndex(opts)]
        const numericValue = typeof value === 'number' ? value : Array.isArray(value) ? value[0] : Number(value)
        return byPayment.totalAmount > 0 ? `${((item.amount / byPayment.totalAmount) * 100).toFixed(1)}%` : `${numericValue.toFixed(1)}%`
      },
    },
    plotOptions: { pie: { donut: { size: '62%' } } },
    tooltip: {
      y: {
        formatter: (v, opts) => {
          const item = byPayment.meta[getSeriesIndex(opts)]
          return `${fmtBRL(v)} • ${item.count.toLocaleString('pt-BR')} cupons`
        },
      },
    },
  }

  const barStoreOpts: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, distributed: true } },
    colors: PALETTE,
    dataLabels: { enabled: false },
    xaxis: { categories: byStore.categories, labels: { formatter: (v) => `R$ ${(+v / 1000).toFixed(0)}k` } },
    tooltip: { y: { formatter: (v) => fmtBRL(v) } },
    legend: { show: false },
    grid: { borderColor: '#f0f0f0', strokeDashArray: 4 },
  }

  const donutAcquirerOpts: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: byAcquirer.labels,
    colors: [PALETTE[2], PALETTE[1], PALETTE[4], PALETTE[5]],
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: {
      style: { fontSize: '12px' },
      formatter: (value, opts) => {
        const item = byAcquirer.meta[getSeriesIndex(opts)]
        const numericValue = typeof value === 'number' ? value : Array.isArray(value) ? value[0] : Number(value)
        return byAcquirer.totalCount > 0 ? `${((item.count / byAcquirer.totalCount) * 100).toFixed(1)}%` : `${numericValue.toFixed(1)}%`
      },
    },
    plotOptions: { pie: { donut: { size: '62%' } } },
    tooltip: {
      y: {
        formatter: (_v, opts) => {
          const item = byAcquirer.meta[getSeriesIndex(opts)]
          return `${item.count.toLocaleString('pt-BR')} cupons • ${fmtBRL(item.amount)}`
        },
      },
    },
  }

  const barProductOpts: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { borderRadius: 4, distributed: true } },
    colors: PALETTE,
    dataLabels: { enabled: false },
    xaxis: {
      categories: topProducts.categories,
      labels: { style: { fontSize: '10px' }, rotate: -30 },
    },
    yaxis: { labels: { formatter: (v) => `R$ ${(v / 1000).toFixed(0)}k` } },
    tooltip: { y: { formatter: (v) => fmtBRL(v) } },
    legend: { show: false },
    grid: { borderColor: '#f0f0f0', strokeDashArray: 4 },
  }

  const donutStatusOpts: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: t.dashboard.charts.statusLabels,
    colors: [PALETTE[2], PALETTE[3]],
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: {
      style: { fontSize: '12px' },
      formatter: (value, opts) => {
        const item = statusCounts.meta[getSeriesIndex(opts)]
        const numericValue = typeof value === 'number' ? value : Array.isArray(value) ? value[0] : Number(value)
        return statusCounts.totalCount > 0 ? `${((item.count / statusCounts.totalCount) * 100).toFixed(1)}%` : `${numericValue.toFixed(1)}%`
      },
    },
    plotOptions: { pie: { donut: { size: '62%' } } },
    tooltip: {
      y: {
        formatter: (_v, opts) => {
          const item = statusCounts.meta[getSeriesIndex(opts)]
          return `${item.count.toLocaleString('pt-BR')} cupons • ${fmtBRL(item.amount)}`
        },
      },
    },
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
    <Box sx={{ minHeight: '100%' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
          p: { xs: 1.5, md: 2 },
          border: '1px solid #e8ecf0',
          borderRadius: 2.5,
          backgroundColor: '#fcfdff',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0d3b45' }}>
            {t.dashboard.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.dashboard.subtitle}
          </Typography>
        </Box>

        {/* Filtro de período */}
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.25, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
            <FilterListIcon sx={{ fontSize: 18, color: '#0d3b45' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d3b45', whiteSpace: 'nowrap' }}>
              {t.dashboard.period}
            </Typography>
          </Stack>
          <Autocomplete
            options={stores}
            value={storeId}
            onChange={(_, value) => setStoreId(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Loja"
                size="small"
                placeholder="Todas"
                sx={{ minWidth: 170, width: { xs: '100%', sm: 190 }, backgroundColor: '#fff' }}
              />
            )}
            sx={{ width: { xs: '100%', sm: 190 } }}
          />
          <DatePicker
            label={t.dashboard.from}
            value={dateFrom}
            onChange={(v) => setDateFrom(v)}
            maxDate={dateTo ?? undefined}
            slotProps={{
              textField: { size: 'small', sx: { minWidth: 148, width: { xs: '100%', sm: 160 }, backgroundColor: '#fff' } },
              field: { clearable: true },
            }}
          />
          <DatePicker
            label={t.dashboard.to}
            value={dateTo}
            onChange={(v) => setDateTo(v)}
            minDate={dateFrom ?? undefined}
            slotProps={{
              textField: { size: 'small', sx: { minWidth: 148, width: { xs: '100%', sm: 160 }, backgroundColor: '#fff' } },
              field: { clearable: true },
            }}
          />
          {hasCustomPeriod && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setDateFrom(defaultDateFrom)
                setDateTo(defaultDateTo)
                setStoreId(null)
              }}
              sx={{ borderColor: '#e85d6a', color: '#e85d6a', '&:hover': { borderColor: '#c0392b', color: '#c0392b' }, width: { xs: '100%', sm: 'auto' } }}
            >
              {t.dashboard.clear}
            </Button>
          )}
          <Chip
            label={`${filteredCoupons.length.toLocaleString('pt-BR')} ${t.dashboard.records}`}
            sx={{ backgroundColor: '#0d3b45', color: '#fff', fontWeight: 600 }}
          />
        </Stack>
      </Stack>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t.dashboard.kpi.totalCoupons}
            value={filteredCoupons.length.toLocaleString('pt-BR')}
            detailPrimary={`Autorizados: ${authorized.length.toLocaleString('pt-BR')}`}
            detailSecondary={`Cancelados: ${cancelled.length.toLocaleString('pt-BR')}`}
            color="#0d3b45"
            icon={<ReceiptLongIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t.dashboard.kpi.totalRevenue}
            value={fmtBRL(grossRevenue)}
            detailPrimary={`Autorizados: ${fmtBRL(totalRevenue)}`}
            detailSecondary={`Cancelados: ${fmtBRL(cancelledRevenue)}`}
            color="#3db8a4"
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t.dashboard.kpi.avgTicket}
            value={fmtBRL(avgTicket)}
            detailPrimary={`Faturado: ${fmtBRL(avgTicket)}`}
            detailSecondary={`Cancelados: ${fmtBRL(avgCancelledTicket)}`}
            color="#f08f4f"
            icon={<ShoppingCartIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t.dashboard.kpi.cancellationRate}
            value={`${cancelRate.toFixed(1)}%`}
            detailPrimary={`${filteredCoupons.length.toLocaleString('pt-BR')} registros`}
            detailSecondary={`${cancelled.length.toLocaleString('pt-BR')} cancelados`}
            detailPrimaryLabel="REGISTROS"
            detailSecondaryLabel="CANCELADOS"
            color="#e85d6a"
            icon={<CancelIcon />}
          />
        </Grid>
      </Grid>

      {/* Row 2: Line chart (full width) */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12 }}>
          <ChartCard title={t.dashboard.charts.dailyRevenue} badge={t.dashboard.charts.authorized}>
            <ReactApexChart
              type="area"
              height={240}
              options={lineOpts}
              series={[{ name: t.dashboard.charts.revenue, data: revenueByDay.values }]}
            />
          </ChartCard>
        </Grid>
      </Grid>

      {/* Row 3: Bar stores + Donut payment */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartCard title={t.dashboard.charts.revenueByStore}>
            <ReactApexChart
              type="bar"
              height={260}
              options={barStoreOpts}
              series={[{ name: t.dashboard.charts.revenue, data: byStore.values }]}
            />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard title={t.dashboard.charts.paymentMethods}>
            <ReactApexChart
              type="donut"
              height={260}
              options={donutPaymentOpts}
              series={byPayment.values}
            />
          </ChartCard>
        </Grid>
      </Grid>

      {/* Row 4: Bar products + Acquirer + Status */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard title={t.dashboard.charts.topProducts} badge={t.dashboard.charts.top8}>
            <ReactApexChart
              type="bar"
              height={280}
              options={barProductOpts}
              series={[{ name: t.dashboard.charts.revenue, data: topProducts.values }]}
            />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ChartCard title={t.dashboard.charts.byAcquirer}>
            <ReactApexChart
              type="donut"
              height={280}
              options={donutAcquirerOpts}
              series={byAcquirer.values}
            />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ChartCard title={t.dashboard.charts.couponStatus}>
            <ReactApexChart
              type="donut"
              height={280}
              options={donutStatusOpts}
              series={[statusCounts.aut, statusCounts.can]}
            />
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
    </LocalizationProvider>
  )
}
