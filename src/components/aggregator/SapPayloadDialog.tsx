import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import dayjs from 'dayjs'
import type { SapPayload } from '../../domain/models'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface SapPayloadDialogProps {
  open: boolean
  payload: SapPayload | null
  onClose: () => void
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <Stack spacing={0.25}>
    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
  </Stack>
)

const SapPayloadDialog = ({ open, payload, onClose }: SapPayloadDialogProps) => {
  if (!payload) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: '#0d3b45',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2.5,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              Payload enviado ao SAP
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.2 }}>
              Simulação de integração — agrupamento {payload.idAgregador}
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {/* Cabeçalho do grupo */}
        <Box
          sx={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e0e7ef',
            borderRadius: 2,
            p: 2,
            mb: 2,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
            Dados do Agrupamento
          </Typography>
          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 2 }}>
            <Field label="ID Agregador"    value={payload.idAgregador} />
            <Field label="Loja"            value={payload.storeId} />
            <Field label="Data"            value={dayjs(payload.date).format('DD/MM/YYYY')} />
            <Field label="Adquirente"      value={payload.acquirer} />
            <Field label="Forma Pgto."     value={payload.paymentMethod} />
            <Field label="Produto"         value={`${payload.productCode} — ${payload.productName}`} />
            <Field label="Agrupado em"     value={dayjs(payload.aggregatedAt).format('DD/MM/YYYY HH:mm')} />
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>Total</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0d3b45', fontSize: 15 }}>
                {currency.format(payload.totalAmount)}
              </Typography>
            </Stack>
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>Cupons</Typography>
              <Chip size="small" label={payload.couponCount} sx={{ backgroundColor: '#e8eaf6', color: '#3949ab', fontWeight: 700, width: 'fit-content' }} />
            </Stack>
          </Stack>
        </Box>

        {/* Tabela de itens */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
          Cupons Fiscais Incluídos ({payload.items.length})
        </Typography>
        <Box sx={{ border: '1px solid #e0e7ef', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1c2536' }}>
                {['Nº Cupom', 'NSU', 'Cód. Produto', 'Qtd.', 'Vlr. Unit.', 'Imposto', 'Total', 'Status', 'Data'].map((h) => (
                  <TableCell key={h} sx={{ color: '#fff', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap', borderBottom: 'none', py: 1 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {payload.items.map((item, i) => (
                <TableRow key={i} sx={{ '&:hover': { backgroundColor: '#f5f8ff' } }}>
                  <TableCell sx={{ fontSize: 11, fontWeight: 600 }}>{item.couponNumber}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{item.nsu}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{item.productCode}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{item.quantity}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{currency.format(item.unitPrice)}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{currency.format(item.tax)}</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700 }}>{currency.format(item.amount)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={item.status === 'autorizado' ? 'Autorizado' : 'Cancelado'}
                      sx={{
                        fontSize: 9, height: 18, fontWeight: 700,
                        backgroundColor: item.status === 'autorizado' ? '#e8f5e9' : '#ffebee',
                        color: item.status === 'autorizado' ? '#2e7d32' : '#c62828',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap' }}>{dayjs(item.createdAt).format('DD/MM/YYYY')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* JSON raw */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
          JSON enviado
        </Typography>
        <pre
          style={{
            backgroundColor: '#f0f4f8',
            border: '1px solid #e0e7ef',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 12,
            overflowX: 'auto',
            margin: 0,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {JSON.stringify({
            idAgregador: payload.idAgregador,
            storeId: payload.storeId,
            date: payload.date,
            aggregatedAt: payload.aggregatedAt,
            productCode: payload.productCode,
            productName: payload.productName,
            acquirer: payload.acquirer,
            paymentMethod: payload.paymentMethod,
            totalAmount: payload.totalAmount,
            couponCount: payload.couponCount,
            items: payload.items,
          }, null, 2)}
        </pre>

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2, backgroundColor: '#0d3b45', '&:hover': { backgroundColor: '#062930' }, textTransform: 'none', fontWeight: 600 }}
          onClick={onClose}
        >
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export { SapPayloadDialog }

