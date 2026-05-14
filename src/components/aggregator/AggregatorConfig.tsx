import HubIcon from '@mui/icons-material/Hub'
import TuneIcon from '@mui/icons-material/Tune'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormGroup,
  Stack,
  Typography,
} from '@mui/material'
import type { AggregationCriteria } from '../../domain/models'

interface AggregatorConfigProps {
  criteria: AggregationCriteria
  onChange: (criteria: AggregationCriteria) => void
  couponCount?: number
  onAggregate?: () => void
  processing?: boolean
}

const options: { key: keyof AggregationCriteria; label: string; description: string }[] = [
  { key: 'byProduct', label: 'Produto', description: 'Agrupa pelo código do produto' },
  { key: 'byStore', label: 'Loja', description: 'Agrupa pelo ID da loja' },
  { key: 'byAcquirer', label: 'Adquirente', description: 'Agrupa pela adquirente (Cielo, Rede…)' },
  { key: 'byPaymentMethod', label: 'Forma de Pagamento', description: 'Agrupa por PIX, Crédito, Débito…' },
  { key: 'byDate', label: 'Data', description: 'Agrupa pela data do cupom (dia)' },
]

const AggregatorConfig = ({
  criteria,
  onChange,
  couponCount = 0,
  onAggregate,
  processing = false,
}: AggregatorConfigProps) => {
  const activeCount = Object.values(criteria).filter(Boolean).length
  const activeLabels = options.filter((o) => criteria[o.key]).map((o) => o.label)

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: '#f7f9fb', minHeight: '100%' }}>
      {/* Header */}
      <Stack direction="row" sx={{ alignItems: 'center', mb: 3 }} spacing={1.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            backgroundColor: '#0d3b4518',
            color: '#0d3b45',
          }}
        >
          <TuneIcon />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0d3b45', lineHeight: 1.2 }}>
            Configuração do Agregador
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Selecione os campos que compõem a chave de agrupamento
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
        {/* Critérios */}
        <Card elevation={0} sx={{ border: '1px solid #e8ecf0', borderRadius: 2, flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a2e35', mb: 2 }}>
              Critérios de agrupamento
            </Typography>
            <FormGroup sx={{ gap: 0.5 }}>
              {options.map(({ key, label, description }) => {
                const isLastActive = criteria[key] && activeCount === 1
                return (
                  <FormControlLabel
                    key={key}
                    sx={{
                      m: 0,
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: criteria[key] ? '#0d3b4540' : '#e8ecf0',
                      backgroundColor: criteria[key] ? '#0d3b4508' : 'transparent',
                      transition: 'all 0.15s',
                      '&:hover': { backgroundColor: isLastActive ? undefined : '#f0f4f8' },
                      opacity: isLastActive ? 0.6 : 1,
                    }}
                    control={
                      <Checkbox
                        size="small"
                        checked={criteria[key]}
                        disabled={isLastActive}
                        onChange={(e) => onChange({ ...criteria, [key]: e.target.checked })}
                        sx={{ color: '#0d3b45', '&.Mui-checked': { color: '#0d3b45' }, mr: 0.5 }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: criteria[key] ? 700 : 400, lineHeight: 1.2 }}>
                          {label}
                          {isLastActive && (
                            <Typography component="span" variant="caption" sx={{ ml: 1, color: '#f08f4f', fontWeight: 600 }}>
                              (mínimo obrigatório)
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {description}
                        </Typography>
                      </Box>
                    }
                  />
                )
              })}
            </FormGroup>
          </CardContent>
        </Card>

        {/* Painel de resumo + ação */}
        <Stack spacing={2} sx={{ width: { xs: '100%', md: 280 } }}>
          <Card elevation={0} sx={{ border: '1px solid #e8ecf0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a2e35', mb: 2 }}>
                Resumo da configuração
              </Typography>

              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Critérios ativos</Typography>
                <Chip
                  label={`${activeCount} de ${options.length}`}
                  size="small"
                  sx={{ backgroundColor: activeCount > 0 ? '#0d3b4518' : '#f0f0f0', fontWeight: 700, fontSize: 11 }}
                />
              </Stack>

              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Cupons a processar</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {couponCount.toLocaleString('pt-BR')}
                </Typography>
              </Stack>

              {activeLabels.length > 0 && (
                <>
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Chave de agrupamento:
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {activeLabels.map((l) => (
                      <Chip
                        key={l}
                        label={l}
                        size="small"
                        sx={{ backgroundColor: '#e3f0ff', color: '#1565c0', fontWeight: 600, fontSize: 10 }}
                      />
                    ))}
                  </Stack>
                </>
              )}

              {activeLabels.length === 0 && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                  Selecione ao menos 1 critério
                </Typography>
              )}
            </CardContent>
          </Card>

          <Button
            variant="contained"
            size="large"
            startIcon={<HubIcon />}
            onClick={onAggregate}
            disabled={processing || activeCount === 0 || couponCount === 0}
            fullWidth
            sx={{
              backgroundColor: '#0d3b45',
              '&:hover': { backgroundColor: '#062930' },
              '&:disabled': { backgroundColor: '#b0bec5' },
              textTransform: 'none',
              fontWeight: 700,
              py: 1.5,
              fontSize: 15,
            }}
          >
            {processing ? 'Agrupando...' : 'Rodar Agregador'}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Após rodar, o resultado será exibido na aba <strong>Agregador</strong>
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

export { AggregatorConfig }
