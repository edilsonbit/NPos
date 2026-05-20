import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CancelIcon from '@mui/icons-material/Cancel'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import FilterListIcon from '@mui/icons-material/FilterList'
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
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

// ─────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────
interface KpiProps {
  label: string
  value: string
  sub?: string
  color: string
  icon: React.ReactNode
}
function KpiCard({ label, value, sub, color, icon }: KpiProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e8ecf0', borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color }}>
              {value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary">
                {sub}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              backgroundColor: `${color}18`,
              color,
            }}
          >
            {icon}
          </Box>
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
    <Card elevation={0} sx={{ border: '1px solid #e8ecf0', borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
  // ── Filtro de período ─────────────────────
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null)
  const [dateTo, setDateTo] = useState<Dayjs | null>(null)

  const filteredCoupons = useMemo(() => {
    if (!dateFrom && !dateTo) return coupons
    return coupons.filter((c) => {
      const d = dayjs(c.createdAt)
      if (dateFrom && d.isBefore(dateFrom.startOf('day'))) return false
      if (dateTo && d.isAfter(dateTo.endOf('day'))) return false
      return true
    })
  }, [coupons, dateFrom, dateTo])

  // 'agrupado' = foi autorizado e depois agregado; conta como receita
  const authorized = useMemo(
    () => filteredCoupons.filter((c) => c.status === 'autorizado' || (c.status as string) === 'agrupado'),
    [filteredCoupons],
  )
  const cancelled = useMemo(() => filteredCoupons.filter((c) => c.status === 'cancelado'), [filteredCoupons])

  const totalRevenue = useMemo(() => authorized.reduce((s, c) => s + c.amount, 0), [authorized])
  const avgTicket = authorized.length ? totalRevenue / authorized.length : 0
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
    const map: Record<string, number> = {}
    authorized.forEach((c) => {
      map[c.paymentMethod] = (map[c.paymentMethod] ?? 0) + c.amount
    })
    return { labels: Object.keys(map), values: Object.values(map).map((v) => +v.toFixed(2)) }
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
    const map: Record<string, number> = {}
    authorized.forEach((c) => {
      map[c.acquirer] = (map[c.acquirer] ?? 0) + 1
    })
    return { labels: Object.keys(map), values: Object.values(map) }
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

  // ── Status dos cupons (donut com 3 fatias) ────
  const statusCounts = useMemo(() => {
    const aut = filteredCoupons.filter((c) => c.status === 'autorizado').length
    const agr = filteredCoupons.filter((c) => (c.status as string) === 'agrupado').length
    const can = cancelled.length
    return { aut, agr, can }
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
    dataLabels: { style: { fontSize: '12px' } },
    plotOptions: { pie: { donut: { size: '62%' } } },
    tooltip: { y: { formatter: (v) => fmtBRL(v) } },
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
    dataLabels: { style: { fontSize: '12px' } },
    plotOptions: { pie: { donut: { size: '62%' } } },
    tooltip: { y: { formatter: (v) => `${v} cupons` } },
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
    colors: [PALETTE[2], PALETTE[4], PALETTE[3]],
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: { style: { fontSize: '12px' } },
    plotOptions: { pie: { donut: { size: '62%' } } },
    tooltip: { y: { formatter: (v) => `${v} cupons` } },
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f7f9fb', minHeight: '100%' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}
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
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
            <FilterListIcon sx={{ fontSize: 18, color: '#0d3b45' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d3b45', whiteSpace: 'nowrap' }}>
              {t.dashboard.period}
            </Typography>
          </Stack>
          <DatePicker
            label={t.dashboard.from}
            value={dateFrom}
            onChange={(v) => setDateFrom(v)}
            maxDate={dateTo ?? undefined}
            slotProps={{
              textField: { size: 'small', sx: { minWidth: 148, backgroundColor: '#fff' } },
              field: { clearable: true },
            }}
          />
          <DatePicker
            label={t.dashboard.to}
            value={dateTo}
            onChange={(v) => setDateTo(v)}
            minDate={dateFrom ?? undefined}
            slotProps={{
              textField: { size: 'small', sx: { minWidth: 148, backgroundColor: '#fff' } },
              field: { clearable: true },
            }}
          />
          {(dateFrom || dateTo) && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => { setDateFrom(null); setDateTo(null) }}
              sx={{ borderColor: '#e85d6a', color: '#e85d6a', '&:hover': { borderColor: '#c0392b', color: '#c0392b' } }}
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
            sub={`${authorized.length.toLocaleString('pt-BR')} ${t.dashboard.kpi.withRevenue}`}
            color="#0d3b45"
            icon={<ReceiptLongIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t.dashboard.kpi.totalRevenue}
            value={fmtBRL(totalRevenue)}
            sub={t.dashboard.kpi.authorizedCoupons}
            color="#3db8a4"
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t.dashboard.kpi.avgTicket}
            value={fmtBRL(avgTicket)}
            sub={t.dashboard.kpi.perAuthorizedCoupon}
            color="#f08f4f"
            icon={<ShoppingCartIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t.dashboard.kpi.cancellationRate}
            value={`${cancelRate.toFixed(1)}%`}
            sub={`${cancelled.length} ${t.dashboard.kpi.cancelled}`}
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
              series={[statusCounts.aut, statusCounts.agr, statusCounts.can]}
            />
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
    </LocalizationProvider>
  )
}
