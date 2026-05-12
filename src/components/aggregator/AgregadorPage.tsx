import {
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import HubIcon from '@mui/icons-material/Hub'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import type { AggregatedCouponGroup, GroupFilters } from '../../domain/models'
import { AggregatedView } from './AggregatedView'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const defaultFilters: GroupFilters = {
  idAgregador: '',
  couponNumber: '',
  storeId: '',
  acquirer: '',
  paymentMethod: '',
  productSearch: '',
  dateFrom: '',
  dateTo: '',
}

interface AgregadorPageProps {
  groups: AggregatedCouponGroup[]
  onGoToCupons: () => void
}

const AgregadorPage = ({ groups, onGoToCupons }: AgregadorPageProps) => {
  const [pendingFilters, setPendingFilters] = useState<GroupFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<GroupFilters>(defaultFilters)
  const [searching, setSearching] = useState(false)

  const triggerSearch = (newFilters: GroupFilters) => {
    setSearching(true)
    setTimeout(() => {
      setAppliedFilters(newFilters)
      setSearching(false)
    }, 500)
  }

  const setField = <K extends keyof GroupFilters>(key: K, value: GroupFilters[K]) =>
    setPendingFilters((prev) => ({ ...prev, [key]: value }))

  // Selects e datas: atualiza pending E aplica imediatamente com loading
  const setInstantField = <K extends keyof GroupFilters>(key: K, value: GroupFilters[K]) => {
    const newFilters = { ...pendingFilters, [key]: value }
    setPendingFilters(newFilters)
    triggerSearch(newFilters)
  }

  const handleSearch = () => triggerSearch(pendingFilters)

  const handleClear = () => {
    setPendingFilters(defaultFilters)
    triggerSearch(defaultFilters)
  }

  const stores = useMemo(() => [...new Set(groups.map((g) => g.storeId))].sort(), [groups])
  const acquirers = useMemo(() => [...new Set(groups.map((g) => g.acquirer))].sort(), [groups])
  const payMethods = useMemo(() => [...new Set(groups.map((g) => g.paymentMethod))].sort(), [groups])

  const filtered = useMemo(() => {
    const f = appliedFilters
    return groups.filter((g) => {
      const matchId = !f.idAgregador || g.idAgregador.toLowerCase().includes(f.idAgregador.toLowerCase())
      const matchNF = !f.couponNumber || g.coupons.some((c) => c.couponNumber.toLowerCase().includes(f.couponNumber.toLowerCase()))
      const matchStore = !f.storeId || g.storeId === f.storeId
      const matchAcquirer = !f.acquirer || g.acquirer === f.acquirer
      const matchPayment = !f.paymentMethod || g.paymentMethod === f.paymentMethod
      const matchProduct =
        !f.productSearch ||
        g.productCode.toLowerCase().includes(f.productSearch.toLowerCase()) ||
        g.productName.toLowerCase().includes(f.productSearch.toLowerCase())
      const matchFrom = !f.dateFrom || dayjs(g.date).isAfter(dayjs(f.dateFrom).subtract(1, 'day'))
      const matchTo = !f.dateTo || dayjs(g.date).isBefore(dayjs(f.dateTo).add(1, 'day'))
      return matchId && matchNF && matchStore && matchAcquirer && matchPayment && matchProduct && matchFrom && matchTo
    })
  }, [groups, appliedFilters])

  const totalAgregado = useMemo(() => filtered.reduce((acc, g) => acc + g.totalAmount, 0), [filtered])
  const totalCupons = useMemo(() => filtered.reduce((acc, g) => acc + g.coupons.length, 0), [filtered])

  if (groups.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 2 }}>
        <HubIcon sx={{ fontSize: 56, color: '#c9d8e8' }} />
        <Typography variant="h6" sx={{ color: '#9e9e9e', fontWeight: 400 }}>
          Nenhum agrupamento gerado ainda
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vá até <strong>Cupons Fiscais</strong>, configure os critérios e clique em <strong>Rodar Agregador</strong>.
        </Typography>
        <Button
          variant="contained"
          startIcon={<HubIcon />}
          onClick={onGoToCupons}
          sx={{ backgroundColor: '#0d3b45', '&:hover': { backgroundColor: '#062930' }, mt: 1 }}
        >
          Ir para Cupons Fiscais
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Título + resumo */}
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2c3d', lineHeight: 1.2 }}>
            Agregador — Visão Agrupada
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Grupos gerados pelo último agrupamento
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip
            size="small"
            icon={<HubIcon sx={{ fontSize: 14 }} />}
            label={`${filtered.length} grupos`}
            sx={{ backgroundColor: '#e8eaf6', color: '#3949ab', fontWeight: 600 }}
          />
          <Chip
            size="small"
            label={`${totalCupons} cupons`}
            sx={{ backgroundColor: '#e3f0ff', color: '#1565c0', fontWeight: 600 }}
          />
          <Chip
            size="small"
            label={currency.format(totalAgregado)}
            sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}
          />
        </Stack>
      </Stack>

      {/* Card: filtros dos grupos + accordion */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e8ecf0', overflow: 'hidden', backgroundColor: '#fff' }}>
        {/* Barra de filtros */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e8ecf0' }}>
          {/* Linha 1 — Selects */}
          <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
            <TextField
              select size="small" label="Loja"
              value={pendingFilters.storeId}
              onChange={(e) => setInstantField('storeId', e.target.value)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {stores.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>

            <TextField
              select size="small" label="Adquirente"
              value={pendingFilters.acquirer}
              onChange={(e) => setInstantField('acquirer', e.target.value)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {acquirers.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>

            <TextField
              select size="small" label="Forma de Pagamento"
              value={pendingFilters.paymentMethod}
              onChange={(e) => setInstantField('paymentMethod', e.target.value)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {payMethods.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Stack>

          {/* Linha 2 — Datas + textos + botão */}
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <DatePicker
              label="Data Início"
              format="DD/MM/YYYY"
              value={pendingFilters.dateFrom ? dayjs(pendingFilters.dateFrom) : null}
              onChange={(v) => setInstantField('dateFrom', v ? v.format('YYYY-MM-DD') : '')}
              slotProps={{ textField: { size: 'small', sx: { width: 165 } } }}
            />
            <DatePicker
              label="Data Fim"
              format="DD/MM/YYYY"
              value={pendingFilters.dateTo ? dayjs(pendingFilters.dateTo) : null}
              onChange={(v) => setInstantField('dateTo', v ? v.format('YYYY-MM-DD') : '')}
              slotProps={{ textField: { size: 'small', sx: { width: 165 } } }}
            />
            <TextField
              size="small" label="Nº do Cupom Fiscal"
              value={pendingFilters.couponNumber}
              onChange={(e) => setField('couponNumber', e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small" label="IdAgregador"
              value={pendingFilters.idAgregador}
              onChange={(e) => setField('idAgregador', e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small" label="Código / Nome do Produto"
              value={pendingFilters.productSearch}
              onChange={(e) => setField('productSearch', e.target.value)}
              sx={{ flex: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' },
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                height: 40,
                flexShrink: 0,
              }}
            >
              Pesquisar
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              sx={{
                borderColor: '#e0e0e0',
                color: '#757575',
                '&:hover': { borderColor: '#bdbdbd', backgroundColor: '#f5f5f5' },
                textTransform: 'none',
                fontWeight: 600,
                px: 2,
                height: 40,
                flexShrink: 0,
              }}
            >
              Limpar
            </Button>
          </Stack>
        </Box>

        {/* LinearProgress durante o filtro */}
        {searching && (
          <LinearProgress sx={{ height: 3, backgroundColor: '#e3f0ff', '& .MuiLinearProgress-bar': { backgroundColor: '#1976d2' } }} />
        )}

        {/* Lista de grupos em accordion */}
        <Box sx={{ p: 2 }}>
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography color="text.secondary" variant="body2">
                Nenhum grupo encontrado para os filtros aplicados.
              </Typography>
            </Box>
          ) : (
            <AggregatedView groups={filtered} />
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export { AgregadorPage }
