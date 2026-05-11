import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import {
  aggregateAndPersistCoupons,
  loadCouponsAndProducts,
} from './application/couponService'
import { AggregatedView } from './components/aggregator/AggregatedView'
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
    <AppShell>
      {/* Configuração dos critérios do agregador */}
      <AggregatorConfig criteria={criteria} onChange={setCriteria} />

      {/* Card principal: filtros + tabela (segue layout de referência) */}
      <Paper
        elevation={0}
        sx={{
          mt: 2,
          borderRadius: 2,
          border: '1px solid #e8ecf0',
          overflow: 'hidden',
          backgroundColor: '#fff',
        }}
      >
        <CouponFiltersBar
          coupons={coupons}
          filters={filters}
          filteredCount={filteredCoupons.length}
          filteredTotal={filteredTotal}
          onChange={setFilters}
          onAggregate={() => void handleAggregate()}
          processing={processing}
        />
        <CouponTable coupons={filteredCoupons} />
      </Paper>

      {/* Visão agrupada em accordion com botão SAP por grupo */}
      {groups.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a2c3d', mb: 1.5 }}>
            Visão Agrupada — {groups.length} grupos gerados
          </Typography>
          <AggregatedView groups={groups} />
        </Box>
      )}
    </AppShell>
  )
}

export default App
