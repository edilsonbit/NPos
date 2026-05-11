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
import FilterListIcon from '@mui/icons-material/FilterList'
import HubIcon from '@mui/icons-material/Hub'
import type { Coupon, CouponFilters } from '../../domain/models'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface CouponFiltersBarProps {
  coupons: Coupon[]
  filters: CouponFilters
  filteredCount: number
  filteredTotal: number
  onChange: (filters: CouponFilters) => void
  onAggregate: () => void
  processing: boolean
}

const set = <K extends keyof CouponFilters>(
  prev: CouponFilters,
  key: K,
  value: CouponFilters[K],
): CouponFilters => ({ ...prev, [key]: value })

const CouponFiltersBar = ({
  coupons,
  filters,
  filteredCount,
  filteredTotal,
  onChange,
  onAggregate,
  processing,
}: CouponFiltersBarProps) => {
  const stores = [...new Set(coupons.map((c) => c.storeId))].sort()
  const acquirers = [...new Set(coupons.map((c) => c.acquirer))].sort()
  const payMethods = [...new Set(coupons.map((c) => c.paymentMethod))].sort()

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e0e7ef', borderRadius: 2, p: 2.5, mb: 2.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }} spacing={1}>
        <FilterListIcon sx={{ color: '#6b7a8d', fontSize: 18 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a2c3d' }}>
          Filtros
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ flexWrap: 'wrap' }} useFlexGap>
        <TextField
          size="small"
          label="Buscar (Nº Cupom / NSU / Produto)"
          value={filters.search}
          onChange={(e) => onChange(set(filters, 'search', e.target.value))}
          sx={{ minWidth: 260 }}
        />

        <TextField
          select
          size="small"
          label="Loja"
          value={filters.storeId}
          onChange={(e) => onChange(set(filters, 'storeId', e.target.value))}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {stores.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>

        <TextField
          select
          size="small"
          label="Adquirente"
          value={filters.acquirer}
          onChange={(e) => onChange(set(filters, 'acquirer', e.target.value))}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {acquirers.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
        </TextField>

        <TextField
          select
          size="small"
          label="Forma de Pagamento"
          value={filters.paymentMethod}
          onChange={(e) => onChange(set(filters, 'paymentMethod', e.target.value))}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {payMethods.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </TextField>

        <TextField
          select
          size="small"
          label="Status"
          value={filters.status}
          onChange={(e) => onChange(set(filters, 'status', e.target.value as CouponFilters['status']))}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="ativo">Ativo</MenuItem>
          <MenuItem value="cancelado">Cancelado</MenuItem>
        </TextField>

        <TextField
          size="small"
          label="De"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={filters.dateFrom}
          onChange={(e) => onChange(set(filters, 'dateFrom', e.target.value))}
          sx={{ minWidth: 140 }}
        />

        <TextField
          size="small"
          label="Até"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={filters.dateTo}
          onChange={(e) => onChange(set(filters, 'dateTo', e.target.value))}
          sx={{ minWidth: 140 }}
        />
      </Stack>

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 2, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            size="small"
            label={`${filteredCount} cupons`}
            sx={{ backgroundColor: '#e3f0ff', color: '#1565c0', fontWeight: 600 }}
          />
          <Chip
            size="small"
            label={currency.format(filteredTotal)}
            sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }}
          />
        </Stack>

        <Box>
          <Button
            variant="contained"
            startIcon={<HubIcon />}
            onClick={onAggregate}
            disabled={processing || filteredCount === 0}
            sx={{ backgroundColor: '#0d3b45', '&:hover': { backgroundColor: '#062930' }, px: 3 }}
          >
            {processing ? 'Agrupando...' : 'Rodar Agregador'}
          </Button>
        </Box>
      </Stack>
    </Paper>
  )
}

export { CouponFiltersBar }
