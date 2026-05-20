import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import VisibilityIcon from '@mui/icons-material/Visibility'
import HubIcon from '@mui/icons-material/Hub'
import dayjs from 'dayjs'
import { memo, useState } from 'react'
import type { AggregatedCouponGroup, AggregationCriteria, ErpPayload, ErpPayloadItem } from '../../domain/models'
import { ErpPayloadDialog } from './SapPayloadDialog'
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
interface AggregatedViewProps {
  groups: AggregatedCouponGroup[]
  criteria: AggregationCriteria
  selectedGroupIds?: Set<string>
  onSelectGroup?: (idAgregador: string) => void
}
const AggregatedView = memo(({ groups, criteria, selectedGroupIds = new Set(), onSelectGroup }: AggregatedViewProps) => {
  const [erpPayload, setErpPayload] = useState<ErpPayload | null>(null)
  if (groups.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{ border: '1px solid #e0e7ef', borderRadius: 2, p: 4, textAlign: 'center' }}
      >
        <HubIcon sx={{ fontSize: 40, color: '#c9d8e8', mb: 1 }} />
        <Typography color="text.secondary">
          Nenhum agrupamento gerado. Configure os critérios e clique em{' '}
          <strong>Agregar Cupons</strong>.
        </Typography>
      </Paper>
    )
  }
  const handleViewDetails = (group: AggregatedCouponGroup, e: React.MouseEvent) => {
    e.stopPropagation()
    const items: ErpPayloadItem[] = group.coupons.map((c) => ({
      couponNumber: c.couponNumber,
      nsu: c.nsu,
      productCode: c.productCode,
      productName: c.productName,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      tax: c.tax,
      amount: c.amount,
      status: c.status,
      createdAt: c.createdAt,
    }))
    setErpPayload({
      idAgregador: group.idAgregador,
      storeId: group.storeId,
      date: group.date,
      aggregatedAt: group.aggregatedAt,
      productCode: group.productCode,
      productName: group.productName,
      acquirer: group.acquirer,
      paymentMethod: group.paymentMethod,
      totalAmount: group.totalAmount,
      couponCount: group.coupons.length,
      items,
    })
  }
  return (
    <>
      <Stack spacing={1}>
        {groups.map((group) => (
          <Accordion
            key={group.idAgregador}
            elevation={0}
            sx={{
              border: '1px solid #e0e7ef',
              borderRadius: '8px !important',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: 0 },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                '&.Mui-expanded': {
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  borderBottom: '1px solid #e0e7ef',
                },
                px: 2.5,
                py: 0.5,
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between', width: '100%', pr: 2 }}
                spacing={1}
              >
                {/* Checkbox + Header */}
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
                  {onSelectGroup && (
                    <Checkbox
                      size="small"
                      checked={selectedGroupIds.has(group.idAgregador)}
                      onChange={() => onSelectGroup(group.idAgregador)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ p: 0 }}
                    />
                  )}
                  {/* Header: mostra apenas os campos correspondentes aos critérios selecionados */}
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    size="small"
                    label={group.idAgregador}
                    sx={{ backgroundColor: '#0d3b45', color: '#fff', fontSize: 10, fontWeight: 700 }}
                  />
                  {criteria.byStore && (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Loja:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{group.storeId}</Typography>
                    </Stack>
                  )}
                  {criteria.byDate && (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Data:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {dayjs(group.date).format('DD/MM/YYYY')}
                      </Typography>
                    </Stack>
                  )}
                  {criteria.byProduct && (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Produto:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {group.productName}
                      </Typography>
                    </Stack>
                  )}
                  {criteria.byAcquirer && (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Adquirente:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{group.acquirer}</Typography>
                    </Stack>
                  )}
                  {criteria.byPaymentMethod && (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Forma Pag.:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{group.paymentMethod}</Typography>
                    </Stack>
                  )}
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Stack sx={{ alignItems: 'flex-end' }}>
                    <Typography variant="caption" color="text.secondary">{group.coupons.length} cupons</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0d3b45' }}>
                      {currency.format(group.totalAmount)}
                    </Typography>
                  </Stack>
                  {/* Ícone de olho para ver detalhes */}
                  <Tooltip title="Ver detalhes">
                    <IconButton
                      size="small"
                      onClick={(e) => handleViewDetails(group, e)}
                      sx={{ color: '#666', '&:hover': { color: '#0d3b45' } }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#fafbfc' }}>
                      {['Nº Cupom', 'NSU', 'Loja', 'Adquirente', 'Pagamento', 'Cód. Produto', 'Nome Produto', 'Qtd.', 'Imposto', 'Valor Total', 'Status', 'Data'].map((h) => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#6b7a8d', borderBottom: '1px solid #e0e7ef', whiteSpace: 'nowrap' }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.coupons.map((c) => (
                      <TableRow key={c.id} sx={{ '&:hover': { backgroundColor: '#f5f8ff' } }}>
                        <TableCell sx={{ fontSize: 11 }}>{c.couponNumber}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{c.nsu}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{c.storeId}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{c.acquirer}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{c.paymentMethod}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{c.productCode}</TableCell>
                        <TableCell sx={{ fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.productName}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{c.quantity}</TableCell>
                        <TableCell sx={{ fontSize: 11 }}>{currency.format(c.tax)}</TableCell>
                        <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{currency.format(c.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={c.status}
                            sx={{
                              fontSize: 9,
                              height: 18,
                              fontWeight: 700,
                              backgroundColor: c.status === 'autorizado' ? '#e8f5e9' : '#ffebee',
                              color: c.status === 'autorizado' ? '#2e7d32' : '#c62828',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                          {dayjs(c.createdAt).format('DD/MM/YYYY')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
      <ErpPayloadDialog
        open={Boolean(erpPayload)}
        payload={erpPayload}
        onClose={() => setErpPayload(null)}
      />
    </>
  )
})
export { AggregatedView }
