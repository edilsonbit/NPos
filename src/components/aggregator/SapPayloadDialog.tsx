import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { SapPayload } from '../../domain/models'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface SapPayloadDialogProps {
  open: boolean
  payload: SapPayload | null
  onClose: () => void
}

const SapPayloadDialog = ({ open, payload, onClose }: SapPayloadDialogProps) => {
  if (!payload) return null

  const formatted = JSON.stringify(
    {
      storeId: payload.storeId,
      idAgregador: payload.idAgregador,
      aggregatedAt: payload.aggregatedAt,
      productCode: payload.productCode,
      productName: payload.productName,
      acquirer: payload.acquirer,
      paymentMethod: payload.paymentMethod,
      totalAmount: currency.format(payload.totalAmount),
    },
    null,
    2,
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: '#0d3b45',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
          Payload enviado ao SAP
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Simulação de integração SAP — envio realizado com sucesso
        </Typography>
        <pre
          style={{
            backgroundColor: '#f0f4f8',
            border: '1px solid #e0e7ef',
            borderRadius: 8,
            padding: '16px',
            fontSize: 13,
            overflowX: 'auto',
            margin: 0,
          }}
        >
          {formatted}
        </pre>
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2, borderColor: '#0d3b45', color: '#0d3b45' }}
          onClick={onClose}
        >
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export { SapPayloadDialog }
