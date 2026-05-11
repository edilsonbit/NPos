import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import {
  aggregateAndPersistCoupons,
  loadCouponsAndProducts,
} from './application/couponService'
import { AgregadorPage } from './components/aggregator/AgregadorPage'
import { AggregatorConfig } from './components/aggregator/AggregatorConfig'
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
  byProduct: false,
  byStore: true,
  byAcquirer: true,
  byPaymentMethod: false,
  byDate: false,
}

const App = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [filters, setFilters] = useState<CouponFilters>(defaultFilters)
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

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchCouponNumber =
        !filters.couponNumber ||
        c.couponNumber.toLowerCase().includes(filters.couponNumber.toLowerCase())

      const matchNsu =
        !filters.nsu ||
        c.nsu.toLowerCase().includes(filters.nsu.toLowerCase())

      const matchProduct =
        !filters.productSearch ||
        c.productCode.toLowerCase().includes(filters.productSearch.toLowerCase()) ||
        c.productName.toLowerCase().includes(filters.productSearch.toLowerCase())

      const matchFrom =
        !filters.dateFrom ||
        dayjs(c.createdAt).isAfter(dayjs(filters.dateFrom).subtract(1, 'day'))

      const matchTo =
        !filters.dateTo ||
        dayjs(c.createdAt).isBefore(dayjs(filters.dateTo).add(1, 'day'))

      return (
        matchCouponNumber &&
        matchNsu &&
        matchProduct &&
        (!filters.storeId || c.storeId === filters.storeId) &&
        (!filters.acquirer || c.acquirer === filters.acquirer) &&
        (!filters.paymentMethod || c.paymentMethod === filters.paymentMethod) &&
        (!filters.status || c.status === filters.status) &&
        matchFrom &&
        matchTo
      )
    })
  }, [coupons, filters])

  const filteredTotal = useMemo(
    () => filteredCoupons.reduce((acc, c) => acc + c.amount, 0),
    [filteredCoupons],
  )

  const handleAggregate = async () => {
    if (!filteredCoupons.length) return
    setProcessing(true)
    try {
      const grouped = await aggregateAndPersistCoupons(filteredCoupons, criteria)
      setGroups(grouped)

      const idMap = new Map(
        grouped.flatMap((g) => g.coupons.map((c) => [c.id, g.idAgregador])),
      )
      setCoupons((prev) =>
        prev.map((c) => {
          const idAgregador = idMap.get(c.id)
          return idAgregador ? { ...c, idAgregador } : c
        }),
      )
      // Navega automaticamente para a página de Agregador
      setActivePage('agregador')
    } finally {
      setProcessing(false)
    }
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
            onClear={() => setFilters(defaultFilters)}
          />
          <CouponTable
            coupons={filteredCoupons}
            filteredCount={filteredCoupons.length}
            filteredTotal={filteredTotal}
            onAggregate={() => void handleAggregate()}
            processing={processing}
          />
        </Paper>
      )}
    </AppShell>
  )
}

export default App
