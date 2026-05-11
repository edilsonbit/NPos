import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import HubIcon from '@mui/icons-material/Hub'
import SearchIcon from '@mui/icons-material/Search'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import type { AggregatedCouponGroup, GroupFilters } from '../../domain/models'
import { AggregatedView } from './AggregatedView'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const defaultFilters: GroupFilters = {
  idAgregador: '',
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
  const [filters, setFilters] = useState<GroupFilters>(defaultFilters)

  const stores = useMemo(() => [...new Set(groups.map((g) => g.storeId))].sort(), [groups])
  const acquirers = useMemo(() => [...new Set(groups.map((g) => g.acquirer))].sort(), [groups])
  const payMethods = useMemo(() => [...new Set(groups.map((g) => g.paymentMethod))].sort(), [groups])

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      const matchId = !filters.idAgregador || g.idAgregador.toLowerCase().includes(filters.idAgregador.toLowerCase())
      const matchStore = !filters.storeId || g.storeId === filters.storeId
      const matchAcquirer = !filters.acquirer || g.acquirer === filters.acquirer
      const matchPayment = !filters.paymentMethod || g.paymentMethod === filters.paymentMethod
      const matchProduct =
        !filters.productSearch ||
        g.productCode.toLowerCase().includes(filters.productSearch.toLowerCase()) ||
        g.productName.toLowerCase().includes(filters.productSearch.toLowerCase())
      const matchFrom = !filters.dateFrom || dayjs(g.date).isAfter(dayjs(filters.dateFrom).subtract(1, 'day'))
      const matchTo = !filters.dateTo || dayjs(g.date).isBefore(dayjs(filters.dateTo).add(1, 'day'))
      return matchId && matchStore && matchAcquirer && matchPayment && matchProduct && matchFrom && matchTo
    })
  }, [groups, filters])

  const totalAgregado = useMemo(() => filtered.reduce((acc, g) => acc + g.totalAmount, 0), [filtered])
  const totalCupons = useMemo(() => filtered.reduce((acc, g) => acc + g.coupons.length, 0), [filtered])

  const set = <K extends keyof GroupFilters>(key: K, value: GroupFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }))

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
              value={filters.storeId}
              onChange={(e) => set('storeId', e.target.value)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {stores.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>

            <TextField
              select size="small" label="Adquirente"
              value={filters.acquirer}
              onChange={(e) => set('acquirer', e.target.value)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {acquirers.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>

            <TextField
              select size="small" label="Forma de Pagamento"
              value={filters.paymentMethod}
              onChange={(e) => set('paymentMethod', e.target.value)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {payMethods.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Stack>

          {/* Linha 2 — Datas + textos + botão */}
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <TextField
              size="small" label="Data Início" type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.dateFrom}
              onChange={(e) => set('dateFrom', e.target.value)}
              sx={{ width: 150 }}
            />
            <TextField
              size="small" label="Data Fim" type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.dateTo}
              onChange={(e) => set('dateTo', e.target.value)}
              sx={{ width: 150 }}
            />
            <TextField
              size="small" label="IdAgregador"
              value={filters.idAgregador}
              onChange={(e) => set('idAgregador', e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small" label="Código / Nome do Produto"
              value={filters.productSearch}
              onChange={(e) => set('productSearch', e.target.value)}
              sx={{ flex: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
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
          </Stack>
        </Box>

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
