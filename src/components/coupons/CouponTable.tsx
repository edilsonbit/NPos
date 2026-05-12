import {
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material'
import HubIcon from '@mui/icons-material/Hub'
import dayjs from 'dayjs'
import { useState } from 'react'
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
]

interface CouponTableProps {
  coupons: Coupon[]
  filteredCount: number
  filteredTotal: number
  onAggregate: () => void
  processing: boolean
}

const CouponTable = ({ coupons, filteredCount, filteredTotal, onAggregate, processing }: CouponTableProps) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const rows = coupons.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box>
      {/* Toolbar acima da tabela */}
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: '1px solid #e8ecf0',
          backgroundColor: '#fafbfc',
        }}
      >
        <Chip
          size="small"
          label={`${filteredCount} registros | ${currency.format(filteredTotal)}`}
          sx={{ backgroundColor: '#e3f0ff', color: '#1565c0', fontWeight: 600, height: 28, borderRadius: 1 }}
        />
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
            height: 32,
            fontSize: 13,
            whiteSpace: 'nowrap',
          }}
        >
          {processing ? 'Agrupando...' : 'Rodar Agregador'}
        </Button>
      </Stack>
      <TableContainer sx={{ maxHeight: 480 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {headCells.map((cell) => (
                <TableCell
                  key={cell.id}
                  sx={{
                    fontWeight: 600,
                    fontSize: 12,
                    backgroundColor: '#1c2536',
                    color: '#fff',
                    borderBottom: 'none',
                    whiteSpace: 'nowrap',
                    py: 1.5,
                    '&.MuiTableCell-stickyHeader': { backgroundColor: '#1c2536' },
                  }}
                >
                  {cell.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headCells.length} align="center" sx={{ py: 6, color: '#9e9e9e', fontSize: 13 }}>
                  Nenhum Log encontrado
                </TableCell>
              </TableRow>
            ) : (
              rows.map((coupon) => (
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
                      label={coupon.status === 'autorizado' ? 'Autorizado' : 'Cancelado'}
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        height: 20,
                        backgroundColor: coupon.status === 'autorizado' ? '#e8f5e9' : '#ffebee',
                        color: coupon.status === 'autorizado' ? '#2e7d32' : '#c62828',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                    {dayjs(coupon.createdAt).format('DD/MM/YYYY')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                colSpan={headCells.length}
                count={coupons.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10))
                  setPage(0)
                }}
                labelRowsPerPage="Registros por página"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                }
                sx={{
                  borderTop: '1px solid #e8ecf0',
                  '& .MuiTablePagination-toolbar': { fontSize: 12 },
                  '& .MuiTablePagination-selectLabel': { fontSize: 12 },
                  '& .MuiTablePagination-displayedRows': { fontSize: 12 },
                }}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      {coupons.length === 0 && (
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', p: 1, color: '#9e9e9e' }}>
          Nenhum registro
        </Typography>
      )}
    </Box>
  )
}

export { CouponTable }
