import {
    Box,
    Button,
    MenuItem,
    Stack,
    TextField,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import dayjs from 'dayjs'
import type { Coupon, CouponFilters } from '../../domain/models'

const selectSx = { flex: 1, minWidth: 100 }

interface CouponFiltersBarProps {
    coupons: Coupon[]
    filters: CouponFilters
    onChange: (filters: CouponFilters) => void
    onInstantChange: (filters: CouponFilters) => void
    onClear: () => void
    onSearch: () => void
}

const set = <K extends keyof CouponFilters>(
    prev: CouponFilters,
    key: K,
    value: CouponFilters[K],
): CouponFilters => ({ ...prev, [key]: value })

const CouponFiltersBar = ({
    coupons,
    filters,
    onChange,
    onInstantChange,
    onClear,
    onSearch,
}: CouponFiltersBarProps) => {
    const stores = [...new Set(coupons.map((c) => c.storeId))].sort()
    const acquirers = [...new Set(coupons.map((c) => c.acquirer))].sort()
    const payMethods = [...new Set(coupons.map((c) => c.paymentMethod))].sort()

    return (
        <Box sx={{ p: 2, borderBottom: '1px solid #e8ecf0' }}>
            {/* Linha 1 — Selects (Loja, Adquirente, Forma de Pagamento, Status) */}
            <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                <TextField
                    select size="small" label="Loja"
                    value={filters.storeId}
                    onChange={(e) => onInstantChange(set(filters, 'storeId', e.target.value))}
                    sx={selectSx}
                >
                    <MenuItem value="">Todos</MenuItem>
                    {stores.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>

                <TextField
                    select size="small" label="Adquirente"
                    value={filters.acquirer}
                    onChange={(e) => onInstantChange(set(filters, 'acquirer', e.target.value))}
                    sx={selectSx}
                >
                    <MenuItem value="">Todas</MenuItem>
                    {acquirers.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </TextField>

                <TextField
                    select size="small" label="Forma de Pagamento"
                    value={filters.paymentMethod}
                    onChange={(e) => onInstantChange(set(filters, 'paymentMethod', e.target.value))}
                    sx={selectSx}
                >
                    <MenuItem value="">Todas</MenuItem>
                    {payMethods.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>

                <TextField
                    select size="small" label="Status"
                    value={filters.status}
                    onChange={(e) => onInstantChange(set(filters, 'status', e.target.value as CouponFilters['status']))}
                    sx={selectSx}
                >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="autorizado">Autorizado</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                </TextField>
            </Stack>

            {/* Linha 2 — Datas, campos de texto, botões */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <DatePicker
                    label="Data Início"
                    format="DD/MM/YYYY"
                    value={filters.dateFrom ? dayjs(filters.dateFrom) : null}
                    onChange={(v) => onInstantChange(set(filters, 'dateFrom', v ? v.format('YYYY-MM-DD') : ''))}
                    slotProps={{ textField: { size: 'small', sx: { width: 165 } } }}
                />
                <DatePicker
                    label="Data Fim"
                    format="DD/MM/YYYY"
                    value={filters.dateTo ? dayjs(filters.dateTo) : null}
                    onChange={(v) => onInstantChange(set(filters, 'dateTo', v ? v.format('YYYY-MM-DD') : ''))}
                    slotProps={{ textField: { size: 'small', sx: { width: 165 } } }}
                />
                <TextField
                    size="small" label="Nº Cupom"
                    value={filters.couponNumber}
                    onChange={(e) => onChange(set(filters, 'couponNumber', e.target.value))}
                    sx={{ flex: 1 }}
                />
                <TextField
                    size="small" label="NSU"
                    value={filters.nsu}
                    onChange={(e) => onChange(set(filters, 'nsu', e.target.value))}
                    sx={{ flex: 1 }}
                />
                <TextField
                    size="small" label="Código / Nome do Produto"
                    value={filters.productSearch}
                    onChange={(e) => onChange(set(filters, 'productSearch', e.target.value))}
                    sx={{ flex: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
                    <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={onSearch}
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
                        variant="outlined"
                        startIcon={<ClearIcon />}
                        onClick={onClear}
                        sx={{
                            borderColor: '#e0e0e0',
                            color: '#757575',
                            '&:hover': { borderColor: '#bdbdbd', backgroundColor: '#f5f5f5' },
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 2,
                            height: 40,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Limpar
                    </Button>

                </Box>
            </Stack>
        </Box>
    )
}

export { CouponFiltersBar }
