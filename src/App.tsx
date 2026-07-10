import { Backdrop, Box, CircularProgress, Fade, Paper, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useEffect, useMemo, useState } from 'react'
import {
  aggregateAndPersistCoupons,
  loadCouponsAndProducts,
  updateCouponsSituacao,
  undoAggregation,
  undoAggregationByNumbers,
} from './application/couponService'
import { logActivity, loadActivityLogs } from './application/activityLogService'
import { reconstructAggregatedGroups } from './domain/aggregateCoupons'
import { AgregadorPage } from './components/aggregator/AgregadorPage'
import { AggregatorConfig } from './components/aggregator/AggregatorConfig'
import { ApiTesterPage } from './components/apiTester/ApiTesterPage'
import { IntegrationAlertsPage } from './components/alerts/IntegrationAlertsPage'
import { LoginPage } from './components/auth/LoginPage'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { LogDashboardPage } from './components/dashboard/LogDashboardPage'
import { CouponFiltersBar } from './components/coupons/CouponFiltersBar'
import { CouponTable } from './components/coupons/CouponTable'
import { AppShell } from './components/layout/AppShell'
import { getFirebaseAuth } from './firebase/client'
import { equalsNormalized, includesNormalized } from './utils/textNormalization'
import type {
  ActivityLog,
  AggregatedCouponGroup,
  AggregationCriteria,
  Coupon,
  CouponFilters,
  CouponStatus,
} from './domain/models'

const defaultFilters: CouponFilters = {
  couponNumber: '',
  nsu: '',
  productSearch: '',
  storeId: '',
  acquirer: '',
  paymentMethod: '',
  status: '',
  situacao: '',
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

const CRITERIA_KEY = 'npos:aggregator:criteria'

const loadCriteria = (): AggregationCriteria => {
  try {
    const raw = localStorage.getItem(CRITERIA_KEY)
    if (raw) return { ...defaultCriteria, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return defaultCriteria
}

const saveCriteria = (c: AggregationCriteria) => {
  localStorage.setItem(CRITERIA_KEY, JSON.stringify(c))
}

const applyCouponFilters = (
  source: Coupon[],
  applied: CouponFilters,
  forcedStatus?: CouponStatus,
): Coupon[] => {
  return source.filter((c) => {
    const matchCouponNumber =
      !applied.couponNumber ||
      includesNormalized(c.couponNumber, applied.couponNumber)

    const matchNsu =
      !applied.nsu ||
      includesNormalized(c.nsu, applied.nsu)

    const matchProduct =
      !applied.productSearch ||
      includesNormalized(c.productCode, applied.productSearch) ||
      includesNormalized(c.productName, applied.productSearch)

    const matchFrom =
      !applied.dateFrom ||
      dayjs(c.createdAt).isAfter(dayjs(applied.dateFrom).subtract(1, 'day'))

    const matchTo =
      !applied.dateTo ||
      dayjs(c.createdAt).isBefore(dayjs(applied.dateTo).add(1, 'day'))

    const statusFilter = forcedStatus ?? applied.status

    return (
      matchCouponNumber &&
      matchNsu &&
      matchProduct &&
      (!applied.storeId || equalsNormalized(c.storeId, applied.storeId)) &&
      (!applied.acquirer || equalsNormalized(c.acquirer, applied.acquirer)) &&
      (!applied.paymentMethod || equalsNormalized(c.paymentMethod, applied.paymentMethod)) &&
      (!statusFilter || c.status === statusFilter) &&
      (!applied.situacao || equalsNormalized(c.situacao, applied.situacao)) &&
      matchFrom &&
      matchTo
    )
  })
}

const App = () => {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [filters, setFilters] = useState<CouponFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<CouponFilters>(defaultFilters)
  const [filtering, setFiltering] = useState(false)
  const [criteria, setCriteria] = useState<AggregationCriteria>(loadCriteria)

  const handleCriteriaChange = (next: AggregationCriteria) => {
    saveCriteria(next)
    setCriteria(next)
  }
  const [groups, setGroups] = useState<AggregatedCouponGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [activePage, setActivePage] = useState('dashboard-cupons')
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const refreshLogs = async () => {
    setLogsLoading(true)
    try {
      const logs = await loadActivityLogs(200)
      setActivityLogs(logs)
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(!!user)
      setUserEmail(user?.email ?? undefined)
    })
    return unsubscribe
  }, [])

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

  useEffect(() => {
    // Reconstroem os grupos agregados quando a pagina Agregador e acessada ou cupons mudam
    if (activePage === 'agregador') {
      const reconstructedGroups = reconstructAggregatedGroups(coupons)
      setGroups(reconstructedGroups)
    }
    // Carrega logs quando a pagina de alertas é acessada
    if (activePage === 'alertas') {
      void refreshLogs()
    }
  }, [activePage, coupons])

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

  const filteredCoupons = useMemo(
    () => applyCouponFilters(coupons, appliedFilters),
    [coupons, appliedFilters],
  )

  const filteredCancelledCoupons = useMemo(
    () => applyCouponFilters(coupons, appliedFilters, 'cancelado'),
    [coupons, appliedFilters],
  )

  const couponsCancelledOnly = useMemo(
    () => coupons.filter((coupon) => coupon.status === 'cancelado'),
    [coupons],
  )

  const filteredTotal = useMemo(
    () => filteredCoupons.reduce((acc, c) => acc + c.amount, 0),
    [filteredCoupons],
  )

  const filteredCancelledTotal = useMemo(
    () => filteredCancelledCoupons.reduce((acc, c) => acc + c.amount, 0),
    [filteredCancelledCoupons],
  )

  const handleAggregate = async (couponsToAggregate: Coupon[]) => {
    // Detecta se sao cupons cancelados verificando o status
    const isCancelledCoupons = couponsToAggregate.length > 0 && couponsToAggregate.every((c) => c.status === 'cancelado')
    
    if (isCancelledCoupons) {
      // Fluxo de envio de cupons cancelados ao ERP
      setProcessing(true)
      try {
        // Delay minimo de 1.5s para o loading ser visivel
        await Promise.all([
          updateCouponsSituacao(couponsToAggregate.map((c) => c.id), 'Enviado ao ERP'),
          new Promise((res) => setTimeout(res, 1500)),
        ])
        await logActivity({
          timestamp: new Date().toISOString(),
          action: 'ENVIAR_ERP',
          description: `${couponsToAggregate.length} cupom(ns) cancelado(s) enviado(s) ao ERP`,
          userId: userEmail,
          status: 'sucesso',
          details: {
            couponIds: couponsToAggregate.map((c) => c.id),
            count: couponsToAggregate.length,
          },
        })
        // Recarregar cupons do Firestore para refletir a situacao "Enviado ao ERP"
        const { coupons: updatedCoupons } = await loadCouponsAndProducts()
        setCoupons(updatedCoupons)
        
        setActivePage('cupons-cancelados')
      } catch (err) {
        await logActivity({
          timestamp: new Date().toISOString(),
          action: 'ENVIAR_ERP',
          description: `Erro ao enviar cupons cancelados ao ERP`,
          userId: userEmail,
          status: 'erro',
          details: { errorMessage: String(err), count: couponsToAggregate.length },
        })
      } finally {
        setProcessing(false)
      }
    } else {
      // Fluxo normal de agregacao
      const aggregatable = couponsToAggregate.filter((coupon) => coupon.status !== 'cancelado')
      if (!aggregatable.length) return

      setProcessing(true)
      try {
        // Delay minimo de 1.5s para o loading ser visivel
        const [grouped] = await Promise.all([
          aggregateAndPersistCoupons(aggregatable, criteria),
          new Promise((res) => setTimeout(res, 1500)),
        ])
        setGroups(grouped)
        await logActivity({
          timestamp: new Date().toISOString(),
          action: 'AGREGAR_CUPONS',
          description: `${aggregatable.length} cupom(ns) agregado(s) em ${grouped.length} grupo(s)`,
          userId: userEmail,
          status: 'sucesso',
          details: {
            couponIds: aggregatable.map((c) => c.id),
            groupIds: grouped.map((g) => g.idAgregador),
            aggregationIds: grouped.map((g) => g.idAgregador),
            count: aggregatable.length,
          },
        })
        // Recarregar cupons do Firestore para refletir a situacao "Agregado"
        const { coupons: updatedCoupons } = await loadCouponsAndProducts()
        setCoupons(updatedCoupons)
        
        setActivePage('agregador')
      } catch (err) {
        await logActivity({
          timestamp: new Date().toISOString(),
          action: 'AGREGAR_CUPONS',
          description: `Erro ao agregar cupons`,
          userId: userEmail,
          status: 'erro',
          details: { errorMessage: String(err), count: aggregatable.length },
        })
      } finally {
        setProcessing(false)
      }
    }
  }

  const handleSendGroupsToErp = async (groupIds: string[]) => {
    setProcessing(true)
    try {
      // Encontrar todos os coupons dos grupos selecionados
      const couponIds = groups
        .filter((g) => groupIds.includes(g.idAgregador))
        .flatMap((g) => g.coupons.map((c) => c.id))

      if (couponIds.length === 0) return

      // Delay minimo de 1.5s para o loading ser visivel
      await Promise.all([
        updateCouponsSituacao(couponIds, 'Enviado ao ERP'),
        new Promise((res) => setTimeout(res, 1500)),
      ])
      await logActivity({
        timestamp: new Date().toISOString(),
        action: 'ENVIAR_ERP',
        description: `${groupIds.length} grupo(s) com ${couponIds.length} cupom(ns) enviado(s) ao ERP`,
        userId: userEmail,
        status: 'sucesso',
        details: { groupIds, aggregationIds: groupIds, couponIds, count: couponIds.length },
      })

      // Recarregar coupons e reconstruir grupos
      const { coupons: updatedCoupons } = await loadCouponsAndProducts()
      setCoupons(updatedCoupons)
      
      // Reconstruir os grupos agregados
      const reconstructedGroups = reconstructAggregatedGroups(updatedCoupons)
      setGroups(reconstructedGroups)
    } catch (err) {
      await logActivity({
        timestamp: new Date().toISOString(),
        action: 'ENVIAR_ERP',
        description: `Erro ao enviar grupos ao ERP`,
        userId: userEmail,
        status: 'erro',
        details: { groupIds, errorMessage: String(err) },
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleUndoAggregation = async (groupId: string) => {
    setProcessing(true)
    try {
      await undoAggregation(groupId)
      await logActivity({
        timestamp: new Date().toISOString(),
        action: 'DESFAZER_AGREGACAO',
        description: `Agregação desfeita para o grupo ${groupId}`,
        userId: userEmail,
        status: 'sucesso',
        details: { groupIds: [groupId], aggregationIds: [groupId] },
      })
      const { coupons: updatedCoupons } = await loadCouponsAndProducts()
      setCoupons(updatedCoupons)
      const reconstructedGroups = reconstructAggregatedGroups(updatedCoupons)
      setGroups(reconstructedGroups)
      setActivePage('cupons')
    } catch (err) {
      await logActivity({
        timestamp: new Date().toISOString(),
        action: 'DESFAZER_AGREGACAO',
        description: `Erro ao desfazer agregação do grupo ${groupId}`,
        userId: userEmail,
        status: 'erro',
        details: { groupIds: [groupId], errorMessage: String(err) },
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleUndoAggregationByNumbers = async (couponNumbers: string[]) => {
    setProcessing(true)
    try {
      const aggregationIds = groups
        .filter((g) => couponNumbers.some((couponNumber) => g.coupons.some((c) => c.couponNumber === couponNumber)))
        .map((g) => g.idAgregador)

      await undoAggregationByNumbers(couponNumbers)
      await logActivity({
        timestamp: new Date().toISOString(),
        action: 'DESFAZER_AGREGACAO',
        description: `Agregação desfeita para ${couponNumbers.length} cupom(ns)`,
        userId: userEmail,
        status: 'sucesso',
        details: {
          couponNumbers,
          aggregationIds,
          groupIds: aggregationIds,
          count: couponNumbers.length,
        },
      })
      const { coupons: updatedCoupons } = await loadCouponsAndProducts()
      setCoupons(updatedCoupons)
      const reconstructedGroups = reconstructAggregatedGroups(updatedCoupons)
      setGroups(reconstructedGroups)
      setActivePage('cupons')
    } catch (err) {
      await logActivity({
        timestamp: new Date().toISOString(),
        action: 'DESFAZER_AGREGACAO',
        description: `Erro ao desfazer agregação`,
        userId: userEmail,
        status: 'erro',
        details: {
          couponNumbers,
          aggregationIds: groups
            .filter((g) => couponNumbers.some((couponNumber) => g.coupons.some((c) => c.couponNumber === couponNumber)))
            .map((g) => g.idAgregador),
          errorMessage: String(err),
        },
      })
    } finally {
      setProcessing(false)
    }
  }

  if (authenticated === null) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress sx={{ color: '#0d3b45' }} />
      </Box>
    )
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

  const pageCardSx = {
    borderRadius: { xs: 2, md: 2.5 },
    border: '1px solid #e8ecf0',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
    overflow: 'hidden',
    backgroundColor: '#fff',
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
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
      userEmail={userEmail}
      onLogout={() => void signOut(getFirebaseAuth())}
    >
      {activePage === 'dashboard-cupons' ? (
        <DashboardPage coupons={coupons} />
      ) : activePage === 'dashboard-log' ? (
        <LogDashboardPage />
      ) : activePage === 'config-agregador' ? (
        <AggregatorConfig
          criteria={criteria}
          onChange={handleCriteriaChange}
          couponCount={filteredCoupons.length}
          onAggregate={() => void handleAggregate(filteredCoupons)}
          processing={processing}
        />
      ) : activePage === 'agregador' ? (
        <AgregadorPage groups={groups} criteria={criteria} onGoToCupons={() => setActivePage('cupons')} onSendToErp={handleSendGroupsToErp} onUndoAggregation={handleUndoAggregation} onUndoAggregationByNumbers={handleUndoAggregationByNumbers} />
      ) : activePage === 'api-tester' ? (
        <ApiTesterPage />
      ) : activePage === 'alertas' ? (
        <IntegrationAlertsPage logs={activityLogs} loading={logsLoading} onRefresh={refreshLogs} />
      ) : activePage === 'cupons-cancelados' ? (
        <Paper
          elevation={0}
          sx={pageCardSx}
        >
          <CouponFiltersBar
            coupons={couponsCancelledOnly}
            filters={filters}
            onChange={setFilters}
            onInstantChange={handleInstantChange}
            onClear={handleClear}
            onSearch={handleSearch}
            hideStatusFilter={true}
          />
          <CouponTable
            coupons={filteredCancelledCoupons}
            filteredCount={filteredCancelledCoupons.length}
            filteredTotal={filteredCancelledTotal}
            onAggregate={(selected) => void handleAggregate(selected)}
            processing={processing}
            filtering={filtering}
            isCancelledOnly={true}
          />
        </Paper>
      ) : (
        /* Pagina padrao: Cupons Fiscais */
        <Paper
          elevation={0}
          sx={pageCardSx}
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
            onAggregate={(selected) => void handleAggregate(selected)}
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

