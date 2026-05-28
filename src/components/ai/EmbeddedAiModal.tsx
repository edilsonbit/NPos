import SendIcon from '@mui/icons-material/Send'
import CloseIcon from '@mui/icons-material/Close'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import type { EmbeddedAiResponse } from '../../application/embeddedAiService'

interface EmbeddedAiModalProps {
  open: boolean
  loading: boolean
  result: EmbeddedAiResponse | null
  onClose: () => void
  onAsk: (prompt: string) => Promise<void>
}

const EmbeddedAiModal = ({ open, loading, result, onClose, onAsk }: EmbeddedAiModalProps) => {
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      const input = document.getElementById('embedded-ai-prompt')
      input?.focus()
    }, 100)

    return () => window.clearTimeout(timer)
  }, [open])

  const submit = async () => {
    if (!prompt.trim() || loading) return
    await onAsk(prompt)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid #d9e4ef',
            boxShadow: '0 28px 56px rgba(15,23,42,0.2)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          background: 'linear-gradient(135deg, #0f766e 0%, #1d4ed8 52%, #0284c7 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <SmartToyIcon sx={{ color: '#7dd3fc' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.25 }}>
              Assistente IA
            </Typography>
            <AutoAwesomeIcon sx={{ fontSize: 18, opacity: 0.95, color: '#fde68a' }} />
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1.5, md: 2.25 }, backgroundColor: '#f7fbff' }}>
        <Stack spacing={1.5}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid #deebf7',
              backgroundColor: '#fff',
              p: { xs: 1.25, md: 1.5 },
            }}
          >
            <Stack spacing={1.2}>
              <TextField
                id="embedded-ai-prompt"
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

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => void submit()}
                  disabled={loading || !prompt.trim()}
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
                    boxShadow: '0 6px 16px rgba(37,99,235,0.3)',
                  }}
                >
                  {loading ? 'Consultando...' : 'Consultar IA'}
                </Button>
                <Button variant="outlined" onClick={() => setPrompt('')} disabled={loading} sx={{ textTransform: 'none' }}>
                  Limpar
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {result && (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                border: '1px solid #deebf7',
                backgroundColor: '#fff',
                p: { xs: 1.25, md: 1.5 },
              }}
            >
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Chip size="small" label={`Status: ${result.status}`} />
                  <Chip size="small" label={`Perfil: ${result.profile}`} />
                  <Chip size="small" label={`Tipo: ${result.queryType}`} />
                </Stack>

                <Alert severity={result.status === 'ok' ? 'success' : result.status === 'forbidden' ? 'error' : 'warning'}>
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
                          - {warning}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Evidencias ({result.evidence.length})
                  </Typography>
                  <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                    {result.evidence.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Nenhuma evidencia disponivel para esta resposta.
                      </Typography>
                    ) : (
                      result.evidence.map((evidence) => (
                        <Paper
                          key={`${evidence.source}-${evidence.recordId}`}
                          variant="outlined"
                          sx={{ p: 1, borderRadius: 1.25, backgroundColor: '#fcfdff' }}
                        >
                          <Typography variant="caption" sx={{ color: '#546e7a', fontWeight: 600 }}>
                            {evidence.source} | {evidence.recordId}
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
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export { EmbeddedAiModal }
