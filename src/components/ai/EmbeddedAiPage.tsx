import SendIcon from '@mui/icons-material/Send'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { EmbeddedAiResponse } from '../../application/embeddedAiService'

interface EmbeddedAiPageProps {
  loading: boolean
  result: EmbeddedAiResponse | null
  onAsk: (prompt: string) => Promise<void>
}

const EmbeddedAiPage = ({ loading, result, onAsk }: EmbeddedAiPageProps) => {
  const [prompt, setPrompt] = useState('')

  const submit = async () => {
    if (!prompt.trim() || loading) return
    await onAsk(prompt)
  }

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid #e8ecf0',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          p: { xs: 1.5, md: 2.5 },
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SmartToyIcon sx={{ color: '#1976d2' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Assistente IA Embarcada
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Consultas operacionais com dados internos (cupons, agrupamentos e logs), sem uso de internet.
          </Typography>

          <TextField
            multiline
            minRows={3}
            maxRows={8}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder='Ex.: "quais cupons foram cancelados em 21/05/26?"'
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                void submit()
              }
            }}
          />

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={() => void submit()}
              disabled={loading || !prompt.trim()}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {loading ? 'Consultando...' : 'Consultar IA'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setPrompt('')}
              disabled={loading}
              sx={{ textTransform: 'none' }}
            >
              Limpar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {result && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            borderRadius: 2.5,
            border: '1px solid #e8ecf0',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
            p: { xs: 1.5, md: 2.5 },
          }}
        >
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip size="small" label={`Status: ${result.status}`} />
              <Chip size="small" label={`Perfil: ${result.profile}`} />
              <Chip size="small" label={`Tipo: ${result.queryType}`} />
            </Stack>

            <Alert
              severity={result.status === 'ok' ? 'success' : result.status === 'forbidden' ? 'error' : 'warning'}
            >
              {result.answer}
            </Alert>

            {result.warnings.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Avisos
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {result.warnings.map((warning) => (
                    <Typography key={warning} variant="body2" color="text.secondary">
                      • {warning}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Evidências ({result.evidence.length})
              </Typography>
              <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                {result.evidence.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma evidência disponível para esta resposta.
                  </Typography>
                ) : (
                  result.evidence.map((evidence) => (
                    <Paper
                      key={`${evidence.source}-${evidence.recordId}`}
                      variant="outlined"
                      sx={{ p: 1, borderRadius: 1.25, backgroundColor: '#fcfdff' }}
                    >
                      <Typography variant="caption" sx={{ color: '#546e7a', fontWeight: 600 }}>
                        {evidence.source} • {evidence.recordId}
                      </Typography>
                      <Typography variant="body2">{evidence.snippet}</Typography>
                    </Paper>
                  ))
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>
      )}
    </Box>
  )
}

export { EmbeddedAiPage }
