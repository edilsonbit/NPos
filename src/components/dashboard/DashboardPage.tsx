import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CancelIcon from '@mui/icons-material/Cancel'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { Coupon } from '../../domain/models'

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
  // 'agrupado' = foi autorizado e depois agregado; conta como receita
  const authorized = useMemo(
    () => coupons.filter((c) => c.status === 'autorizado' || (c.status as string) === 'agrupado'),
    [coupons],
  )
  const cancelled = useMemo(() => coupons.filter((c) => c.status === 'cancelado'), [coupons])

  const totalRevenue = useMemo(() => authorized.reduce((s, c) => s + c.amount, 0), [authorized])
  const avgTicket = authorized.length ? totalRevenue / authorized.length : 0
  const cancelRate = coupons.length ? (cancelled.length / coupons.length) * 100 : 0

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
    const aut = coupons.filter((c) => c.status === 'autorizado').length
    const agr = coupons.filter((c) => (c.status as string) === 'agrupado').length
    const can = cancelled.length
    return { aut, agr, can }
  }, [coupons, cancelled])

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
    labels: ['Autorizado', 'Agrupado', 'Cancelado'],
    colors: [PALETTE[2], PALETTE[4], PALETTE[3]],
    legend: { position: 'bottom', fontSize: '12px' },
    dataLabels: { style: { fontSize: '12px' } },
    plotOptions: { pie: { donut: { size: '62%' } } },
    tooltip: { y: { formatter: (v) => `${v} cupons` } },
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f7f9fb', minHeight: '100%' }}>
      {/* Header */}
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0d3b45' }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visão geral dos cupons fiscais em tempo real
          </Typography>
        </Box>
        <Chip
          label={`${coupons.length.toLocaleString('pt-BR')} registros`}
          sx={{ backgroundColor: '#0d3b45', color: '#fff', fontWeight: 600 }}
        />
      </Stack>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Total de Cupons"
            value={coupons.length.toLocaleString('pt-BR')}
            sub={`${authorized.length.toLocaleString('pt-BR')} com receita`}
            color="#0d3b45"
            icon={<ReceiptLongIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Faturamento Total"
            value={fmtBRL(totalRevenue)}
            sub="cupons autorizados"
            color="#3db8a4"
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Ticket Médio"
            value={fmtBRL(avgTicket)}
            sub="por cupom autorizado"
            color="#f08f4f"
            icon={<ShoppingCartIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label="Taxa de Cancelamento"
            value={`${cancelRate.toFixed(1)}%`}
            sub={`${cancelled.length} cancelados`}
            color="#e85d6a"
            icon={<CancelIcon />}
          />
        </Grid>
      </Grid>

      {/* Row 2: Line chart (full width) */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12 }}>
          <ChartCard title="Faturamento Diário" badge="Autorizados">
            <ReactApexChart
              type="area"
              height={240}
              options={lineOpts}
              series={[{ name: 'Faturamento', data: revenueByDay.values }]}
            />
          </ChartCard>
        </Grid>
      </Grid>

      {/* Row 3: Bar stores + Donut payment */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartCard title="Faturamento por Loja">
            <ReactApexChart
              type="bar"
              height={260}
              options={barStoreOpts}
              series={[{ name: 'Faturamento', data: byStore.values }]}
            />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard title="Meios de Pagamento">
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
          <ChartCard title="Top Produtos por Receita" badge="Top 8">
            <ReactApexChart
              type="bar"
              height={280}
              options={barProductOpts}
              series={[{ name: 'Receita', data: topProducts.values }]}
            />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ChartCard title="Por Adquirente">
            <ReactApexChart
              type="donut"
              height={280}
              options={donutAcquirerOpts}
              series={byAcquirer.values}
            />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ChartCard title="Status dos Cupons">
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
  )
}
