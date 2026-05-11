import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import HubIcon from '@mui/icons-material/Hub'
import SearchIcon from '@mui/icons-material/Search'
import type { Coupon, CouponFilters } from '../../domain/models'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const selectSx = { flex: 1, minWidth: 100 }

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
    <Box sx={{ p: 2, borderBottom: '1px solid #e8ecf0' }}>
      {/* Linha 1 — Selects (Cliente, Integração, Origem, Destino, Status, Erro) */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
        <TextField
          select size="small" label="Loja"
          value={filters.storeId}
          onChange={(e) => onChange(set(filters, 'storeId', e.target.value))}
          sx={selectSx}
        >
          <MenuItem value="">Todos</MenuItem>
          {stores.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>

        <TextField
          select size="small" label="Adquirente"
          value={filters.acquirer}
          onChange={(e) => onChange(set(filters, 'acquirer', e.target.value))}
          sx={selectSx}
        >
          <MenuItem value="">Todas</MenuItem>
          {acquirers.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
        </TextField>

        <TextField
          select size="small" label="Forma de Pagamento"
          value={filters.paymentMethod}
          onChange={(e) => onChange(set(filters, 'paymentMethod', e.target.value))}
          sx={selectSx}
        >
          <MenuItem value="">Todas</MenuItem>
          {payMethods.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </TextField>

        <TextField select size="small" label="Origem" defaultValue="" sx={selectSx}>
          <MenuItem value="">Todos</MenuItem>
        </TextField>

        <TextField
          select size="small" label="Status"
          value={filters.status}
          onChange={(e) => onChange(set(filters, 'status', e.target.value as CouponFilters['status']))}
          sx={selectSx}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="ativo">Ativo</MenuItem>
          <MenuItem value="cancelado">Cancelado</MenuItem>
        </TextField>

        <TextField select size="small" label="Erro" defaultValue="" sx={selectSx}>
          <MenuItem value="">Todos</MenuItem>
        </TextField>
      </Stack>

      {/* Linha 2 — Datas, campos de texto, botões */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <TextField
          size="small" label="Data Início" type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={filters.dateFrom}
          onChange={(e) => onChange(set(filters, 'dateFrom', e.target.value))}
          sx={{ width: 150 }}
        />
        <TextField
          size="small" label="Data Fim" type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={filters.dateTo}
          onChange={(e) => onChange(set(filters, 'dateTo', e.target.value))}
          sx={{ width: 150 }}
        />
        <TextField
          size="small" label="Nº Cupom"
          value={filters.search}
          onChange={(e) => onChange(set(filters, 'search', e.target.value))}
          sx={{ flex: 1 }}
        />
        <TextField size="small" label="NSU" sx={{ flex: 1 }} />
        <TextField size="small" label="Produto" sx={{ flex: 1 }} />
        <TextField size="small" label="IdAgregador" sx={{ flex: 1 }} />

        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {/* Chips de resultado */}
          <Chip
            size="small"
            label={`${filteredCount} | ${currency.format(filteredTotal)}`}
            sx={{ backgroundColor: '#e3f0ff', color: '#1565c0', fontWeight: 600, height: 32, borderRadius: 1 }}
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
            }}
          >
            Pesquisar
          </Button>
          <Button
            variant="contained"
            startIcon={<HubIcon />}
            onClick={onAggregate}
            disabled={processing || filteredCount === 0}
            sx={{
              backgroundColor: '#0d3b45',
              '&:hover': { backgroundColor: '#062930' },
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              height: 40,
              whiteSpace: 'nowrap',
            }}
          >
            {processing ? 'Agrupando...' : 'Rodar Agregador'}
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}

export { CouponFiltersBar }
