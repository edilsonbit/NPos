import {
    Box,
    Button,
    MenuItem,
    TextField,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import dayjs from 'dayjs'
import type { Coupon, CouponFilters } from '../../domain/models'
import { uniqueNormalized } from '../../utils/textNormalization'

const selectSx = { width: '100%' }

interface CouponFiltersBarProps {
    coupons: Coupon[]
    filters: CouponFilters
    onChange: (filters: CouponFilters) => void
    onInstantChange: (filters: CouponFilters) => void
    onClear: () => void
    onSearch: () => void
    hideStatusFilter?: boolean
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
    hideStatusFilter,
}: CouponFiltersBarProps) => {
    const stores = uniqueNormalized(coupons.map((c) => c.storeId))
    const acquirers = uniqueNormalized(coupons.map((c) => c.acquirer))
    const payMethods = uniqueNormalized(coupons.map((c) => c.paymentMethod))
    const situacoes = [...new Set(coupons.filter((c) => c.situacao).map((c) => c.situacao))].sort() as string[]

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid #e8ecf0', backgroundColor: '#fcfdff' }}>
            {/* Linha 1 — Selects (Loja, Adquirente, Forma de Pagamento, Status, Situação) */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(120px, 1fr))' },
                gap: 1.5,
                mb: 1.5,
            }}>
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

                {!hideStatusFilter && (
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
                )}

                <TextField
                    select size="small" label="Situação"
                    value={filters.situacao}
                    onChange={(e) => onInstantChange(set(filters, 'situacao', e.target.value as CouponFilters['situacao']))}
                    sx={{ ...selectSx, gridColumn: { xs: '1 / -1', md: 'auto' } }}
                >
                    <MenuItem value="">Todas</MenuItem>
                    {situacoes.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
            </Box>

            {/* Linha 2 — Datas + campos de texto */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(120px, 1fr))' },
                gap: 1.5,
                mb: 1.5,
            }}>
                <Box>
                    <DatePicker
                        label="Data Início"
                        format="DD/MM/YYYY"
                        value={filters.dateFrom ? dayjs(filters.dateFrom) : null}
                        onChange={(v) => onInstantChange(set(filters, 'dateFrom', v ? v.format('YYYY-MM-DD') : ''))}
                        slotProps={{ textField: { size: 'small', sx: { width: '100%' } } }}
                    />
                </Box>
                <Box>
                    <DatePicker
                        label="Data Fim"
                        format="DD/MM/YYYY"
                        value={filters.dateTo ? dayjs(filters.dateTo) : null}
                        onChange={(v) => onInstantChange(set(filters, 'dateTo', v ? v.format('YYYY-MM-DD') : ''))}
                        slotProps={{ textField: { size: 'small', sx: { width: '100%' } } }}
                    />
                </Box>
                <TextField
                    size="small" label="Nº Cupom"
                    value={filters.couponNumber}
                    onChange={(e) => onChange(set(filters, 'couponNumber', e.target.value))}
                    sx={{ width: '100%' }}
                />
                <TextField
                    size="small" label="NSU"
                    value={filters.nsu}
                    onChange={(e) => onChange(set(filters, 'nsu', e.target.value))}
                    sx={{ width: '100%' }}
                />
                <TextField
                    size="small" label="Código / Nome do Produto"
                    value={filters.productSearch}
                    onChange={(e) => onChange(set(filters, 'productSearch', e.target.value))}
                    sx={{ width: '100%', gridColumn: { xs: '1 / -1', md: 'auto' } }}
                />
            </Box>

            {/* Linha 3 — Botões */}
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr 1fr', sm: 'auto auto' }, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
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
                        borderRadius: 1.5,
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
                        borderRadius: 1.5,
                    }}
                >
                    Limpar
                </Button>
            </Box>
        </Box>
    )
}

export { CouponFiltersBar }
