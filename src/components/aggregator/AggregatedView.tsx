import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SendIcon from '@mui/icons-material/Send'
import HubIcon from '@mui/icons-material/Hub'
import dayjs from 'dayjs'
import { memo, useState } from 'react'
import type { AggregatedCouponGroup, SapPayload } from '../../domain/models'
import { SapPayloadDialog } from './SapPayloadDialog'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface AggregatedViewProps {
  groups: AggregatedCouponGroup[]
}

const AggregatedView = memo(({ groups }: AggregatedViewProps) => {
  const [sapPayload, setSapPayload] = useState<SapPayload | null>(null)

  if (groups.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{ border: '1px solid #e0e7ef', borderRadius: 2, p: 4, textAlign: 'center' }}
      >
        <HubIcon sx={{ fontSize: 40, color: '#c9d8e8', mb: 1 }} />
        <Typography color="text.secondary">
          Nenhum agrupamento gerado. Configure os critérios e clique em{' '}
          <strong>Rodar Agregador</strong>.
        </Typography>
      </Paper>
    )
  }

  const handleSap = (group: AggregatedCouponGroup, e: React.MouseEvent) => {
    e.stopPropagation()
    setSapPayload({
      storeId: group.storeId,
      idAgregador: group.idAgregador,
      aggregatedAt: group.aggregatedAt,
      productCode: group.productCode,
      productName: group.productName,
      acquirer: group.acquirer,
      paymentMethod: group.paymentMethod,
      totalAmount: group.totalAmount,
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
                {/* Campos obrigatórios do header conforme Issue #1 */}
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    size="small"
                    label={group.idAgregador}
                    sx={{ backgroundColor: '#0d3b45', color: '#fff', fontSize: 10, fontWeight: 700 }}
                  />
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Loja:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{group.storeId}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Data:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {dayjs(group.date).format('DD/MM/YYYY')}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Produto:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {group.productName}
                    </Typography>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Stack sx={{ alignItems: 'flex-end' }}>
                    <Typography variant="caption" color="text.secondary">{group.coupons.length} cupons</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0d3b45' }}>
                      {currency.format(group.totalAmount)}
                    </Typography>
                  </Stack>
                  {/* Botão SAP por grupo — stopPropagation para não fechar accordion */}
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={(e) => handleSap(group, e)}
                    sx={{
                      backgroundColor: '#e65100',
                      '&:hover': { backgroundColor: '#bf360c' },
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      px: 1.5,
                    }}
                  >
                    Enviar para SAP
                  </Button>
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

      <SapPayloadDialog
        open={Boolean(sapPayload)}
        payload={sapPayload}
        onClose={() => setSapPayload(null)}
      />
    </>
  )
})

export { AggregatedView }
