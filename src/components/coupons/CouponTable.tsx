import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import type { Coupon } from '../../domain/models'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const headCells = [
  { id: 'couponNumber', label: 'Nº Cupom' },
  { id: 'nsu', label: 'NSU' },
  { id: 'storeId', label: 'Loja' },
  { id: 'acquirer', label: 'Adquirente' },
  { id: 'paymentMethod', label: 'Forma Pagamento' },
  { id: 'productCode', label: 'Cód. Produto' },
  { id: 'productName', label: 'Nome do Produto' },
  { id: 'quantity', label: 'Qtd.' },
  { id: 'tax', label: 'Imposto' },
  { id: 'amount', label: 'Valor Total' },
  { id: 'status', label: 'Status' },
  { id: 'createdAt', label: 'Data' },
  { id: 'idAgregador', label: 'IdAgregador' },
]

interface CouponTableProps {
  coupons: Coupon[]
  maxRows?: number
}

const CouponTable = ({ coupons, maxRows = 200 }: CouponTableProps) => {
  const rows = coupons.slice(0, maxRows)

  return (
    <Paper elevation={0} sx={{ border: '1px solid #e0e7ef', borderRadius: 2 }}>
      <TableContainer sx={{ maxHeight: 520 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {headCells.map((cell) => (
                <TableCell
                  key={cell.id}
                  sx={{
                    fontWeight: 700,
                    fontSize: 12,
                    backgroundColor: '#f8fafc',
                    color: '#1a2c3d',
                    borderBottom: '2px solid #e0e7ef',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cell.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((coupon) => (
              <TableRow
                key={coupon.id}
                sx={{
                  '&:hover': { backgroundColor: '#f5f8ff' },
                  '&:last-child td': { border: 0 },
                  opacity: coupon.status === 'cancelado' ? 0.5 : 1,
                }}
              >
                <TableCell sx={{ fontSize: 12 }}>{coupon.couponNumber}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{coupon.nsu}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{coupon.storeId}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{coupon.acquirer}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{coupon.paymentMethod}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{coupon.productCode}</TableCell>
                <TableCell sx={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {coupon.productName}
                </TableCell>
                <TableCell sx={{ fontSize: 12 }}>{coupon.quantity}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{currency.format(coupon.tax)}</TableCell>
                <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{currency.format(coupon.amount)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={coupon.status}
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      height: 20,
                      backgroundColor: coupon.status === 'ativo' ? '#e8f5e9' : '#ffebee',
                      color: coupon.status === 'ativo' ? '#2e7d32' : '#c62828',
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                  {dayjs(coupon.createdAt).format('DD/MM/YYYY')}
                </TableCell>
                <TableCell sx={{ fontSize: 11, color: '#6b7a8d' }}>
                  {coupon.idAgregador ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {coupons.length > maxRows && (
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', p: 1, color: '#6b7a8d' }}>
          Exibindo {maxRows} de {coupons.length} cupons
        </Typography>
      )}
    </Paper>
  )
}

export { CouponTable }
