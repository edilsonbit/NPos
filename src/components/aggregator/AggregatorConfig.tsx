import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import TuneIcon from '@mui/icons-material/Tune'
import type { AggregationCriteria } from '../../domain/models'

interface AggregatorConfigProps {
  criteria: AggregationCriteria
  onChange: (criteria: AggregationCriteria) => void
}

const options: { key: keyof AggregationCriteria; label: string }[] = [
  { key: 'byProduct', label: 'Produto' },
  { key: 'byAcquirer', label: 'Adquirente' },
  { key: 'byStore', label: 'Loja' },
  { key: 'byDate', label: 'Data' },
  { key: 'byPaymentMethod', label: 'Forma de Pagamento' },
]

const AggregatorConfig = ({ criteria, onChange }: AggregatorConfigProps) => (
  <Paper elevation={0} sx={{ border: '1px solid #e0e7ef', borderRadius: 2, p: 2.5, mb: 2.5 }}>
    <Stack direction="row" sx={{ alignItems: 'center', mb: 1.5 }} spacing={1}>
      <TuneIcon sx={{ color: '#6b7a8d', fontSize: 18 }} />
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a2c3d' }}>
        Configuração do Agregador
      </Typography>
      <Typography variant="caption" sx={{ color: '#6b7a8d' }}>
        — selecione os campos que compõem a chave de agrupamento
      </Typography>
    </Stack>

    <FormGroup row>
      {options.map(({ key, label }) => (
        <FormControlLabel
          key={key}
          control={
            <Checkbox
              size="small"
              checked={criteria[key]}
              onChange={(e) => onChange({ ...criteria, [key]: e.target.checked })}
              sx={{ color: '#0d3b45', '&.Mui-checked': { color: '#0d3b45' } }}
            />
          }
          label={<Typography variant="body2" sx={{ fontWeight: criteria[key] ? 700 : 400 }}>{label}</Typography>}
        />
      ))}
    </FormGroup>
  </Paper>
)

export { AggregatorConfig }
