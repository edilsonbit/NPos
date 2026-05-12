import { Backdrop, Box, CircularProgress, Fade, Paper, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import {
  aggregateAndPersistCoupons,
  loadCouponsAndProducts,
} from './application/couponService'
import { AgregadorPage } from './components/aggregator/AgregadorPage'
import { AggregatorConfig } from './components/aggregator/AggregatorConfig'
import { LoginPage } from './components/auth/LoginPage'
import { CouponFiltersBar } from './components/coupons/CouponFiltersBar'
import { CouponTable } from './components/coupons/CouponTable'
import { AppShell } from './components/layout/AppShell'
import type {
  AggregatedCouponGroup,
  AggregationCriteria,
  Coupon,
  CouponFilters,
} from './domain/models'

const defaultFilters: CouponFilters = {
  couponNumber: '',
  nsu: '',
  productSearch: '',
  storeId: '',
  acquirer: '',
  paymentMethod: '',
  status: '',
  dateFrom: '',
  dateTo: '',
}

const defaultCriteria: AggregationCriteria = {
  byProduct: true,
  byStore: true,
  byAcquirer: true,
  byPaymentMethod: true,
  byDate: true,
}

const App = () => {
  const [authenticated, setAuthenticated] = useState(false)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [filters, setFilters] = useState<CouponFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<CouponFilters>(defaultFilters)
  const [filtering, setFiltering] = useState(false)
  const [criteria, setCriteria] = useState<AggregationCriteria>(defaultCriteria)
  const [groups, setGroups] = useState<AggregatedCouponGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [activePage, setActivePage] = useState('cupons')

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const payload = await loadCouponsAndProducts()
        setCoupons(payload.coupons)
      } finally {
        setLoading(false)
      }
    }
    void bootstrap()
  }, [])

  const triggerFilter = (newFilters: CouponFilters) => {
    setFiltering(true)
    setTimeout(() => {
      setAppliedFilters(newFilters)
      setFiltering(false)
    }, 500)
  }

  const handleSearch = () => triggerFilter(filters)

  const handleInstantChange = (newFilters: CouponFilters) => {
    setFilters(newFilters)
    triggerFilter(newFilters)
  }

  const handleClear = () => {
    setFilters(defaultFilters)
    triggerFilter(defaultFilters)
  }

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchCouponNumber =
        !appliedFilters.couponNumber ||
        c.couponNumber.toLowerCase().includes(appliedFilters.couponNumber.toLowerCase())

      const matchNsu =
        !appliedFilters.nsu ||
        c.nsu.toLowerCase().includes(appliedFilters.nsu.toLowerCase())

      const matchProduct =
        !appliedFilters.productSearch ||
        c.productCode.toLowerCase().includes(appliedFilters.productSearch.toLowerCase()) ||
        c.productName.toLowerCase().includes(appliedFilters.productSearch.toLowerCase())

      const matchFrom =
        !appliedFilters.dateFrom ||
        dayjs(c.createdAt).isAfter(dayjs(appliedFilters.dateFrom).subtract(1, 'day'))

      const matchTo =
        !appliedFilters.dateTo ||
        dayjs(c.createdAt).isBefore(dayjs(appliedFilters.dateTo).add(1, 'day'))

      return (
        matchCouponNumber &&
        matchNsu &&
        matchProduct &&
        (!appliedFilters.storeId || c.storeId === appliedFilters.storeId) &&
        (!appliedFilters.acquirer || c.acquirer === appliedFilters.acquirer) &&
        (!appliedFilters.paymentMethod || c.paymentMethod === appliedFilters.paymentMethod) &&
        (!appliedFilters.status || c.status === appliedFilters.status) &&
        matchFrom &&
        matchTo
      )
    })
  }, [coupons, appliedFilters])

  const filteredTotal = useMemo(
    () => filteredCoupons.reduce((acc, c) => acc + c.amount, 0),
    [filteredCoupons],
  )

  const handleAggregate = async () => {
    if (!filteredCoupons.length) return
    setProcessing(true)
    try {
      // Delay mínimo de 1.5s para o loading ser visível
      const [grouped] = await Promise.all([
        aggregateAndPersistCoupons(filteredCoupons, criteria),
        new Promise((res) => setTimeout(res, 1500)),
      ])
      setGroups(grouped)
      setActivePage('agregador')
    } finally {
      setProcessing(false)
    }
  }

  if (!authenticated) {
    return <LoginPage onLogin={() => setAuthenticated(true)} />
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress sx={{ color: '#0d3b45' }} />
          <Typography color="text.secondary">Carregando cupons...</Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <>
    <Backdrop
      open={processing}
      sx={{ zIndex: 2000, flexDirection: 'column', gap: 3, backgroundColor: 'rgba(13,59,69,0.82)' }}
    >
      <Fade in={processing}>
        <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress size={72} thickness={3} sx={{ color: '#f08f4f' }} />
            <CircularProgress
              size={72}
              thickness={3}
              variant="determinate"
              value={100}
              sx={{ color: 'rgba(255,255,255,0.15)', position: 'absolute', left: 0 }}
            />
          </Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}>
            Rodando Agregador...
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Agrupando {filteredCoupons.length} registros
          </Typography>
        </Stack>
      </Fade>
    </Backdrop>
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'config-agregador' ? (
        <AggregatorConfig criteria={criteria} onChange={setCriteria} />
      ) : activePage === 'agregador' ? (
        <AgregadorPage groups={groups} onGoToCupons={() => setActivePage('cupons')} />
      ) : (
        /* Página padrão: Cupons Fiscais */
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid #e8ecf0',
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}
        >
          <CouponFiltersBar
            coupons={coupons}
            filters={filters}
            onChange={setFilters}
            onInstantChange={handleInstantChange}
            onClear={handleClear}
            onSearch={handleSearch}
          />
          <CouponTable
            coupons={filteredCoupons}
            filteredCount={filteredCoupons.length}
            filteredTotal={filteredTotal}
            onAggregate={() => void handleAggregate()}
            processing={processing}
            filtering={filtering}
          />
        </Paper>
      )}
    </AppShell>
    </>
  )
}

export default App
