import SendIcon from '@mui/icons-material/Send'
import CloseIcon from '@mui/icons-material/Close'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import {
  Box,
  Button,
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
import { useEffect, useRef, useState } from 'react'
import type { EmbeddedAiResponse } from '../../application/embeddedAiService'

const ASSISTANT_CHAT_HISTORY_KEY = 'assistantChatHistory'

const loadAssistantChatHistory = (): AssistantMessage[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(ASSISTANT_CHAT_HISTORY_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (item): item is AssistantMessage =>
        item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string',
    )
  } catch {
    return []
  }
}

const saveAssistantChatHistory = (messages: AssistantMessage[]) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(ASSISTANT_CHAT_HISTORY_KEY, JSON.stringify(messages))
  } catch {
    // ignore storage errors
  }
}

interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
}

interface EmbeddedAiModalProps {
  open: boolean
  loading: boolean
  result: EmbeddedAiResponse | null
  onClose: () => void
  onAsk: (prompt: string, conversation: AssistantMessage[]) => Promise<void>
}

const EmbeddedAiModal = ({ open, loading, result, onClose, onAsk }: EmbeddedAiModalProps) => {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>(() => loadAssistantChatHistory())
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      const input = document.getElementById('embedded-ai-prompt')
      input?.focus()
    }, 100)

    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (!result || loading) return

    setMessages((current) => {
      const last = current[current.length - 1]
      if (last?.role === 'assistant' && last.content === result.answer) return current
      const assistantMessage: AssistantMessage = { role: 'assistant', content: result.answer }
      return [...current, assistantMessage]
    })
  }, [result, loading, open])

  useEffect(() => {
    saveAssistantChatHistory(messages)
  }, [messages])

  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, open])

  useEffect(() => {
    if (!open) {
      setPrompt('')
    }
  }, [open])

  const submit = async () => {
    const trimmed = prompt.trim()
    if (!trimmed || loading) return

    const userMessage: AssistantMessage = { role: 'user', content: trimmed }
    const nextMessages: AssistantMessage[] = [...messages, userMessage]
    setMessages(nextMessages)
    setPrompt('')
    await onAsk(trimmed, nextMessages)
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

      <DialogContent sx={{ p: 0, backgroundColor: '#e5ddd5' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 140px)',
            maxHeight: 660,
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 240,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, textAlign: 'center' }}>
                  Digite sua pergunta para iniciar a conversa com o assistente. Ele responde em forma de chat, apenas com pergunta e resposta.
                </Typography>
              </Box>
            ) : (
              messages.map((message, index) => (
                <Box
                  key={`${message.role}-${index}`}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      maxWidth: '80%',
                      p: 1.5,
                      borderRadius: 3,
                      backgroundColor: message.role === 'user' ? '#dcf8c6' : '#ffffff',
                      color: '#152238',
                      borderTopLeftRadius: message.role === 'assistant' ? 0 : 16,
                      borderTopRightRadius: message.role === 'user' ? 0 : 16,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.content}
                    </Typography>
                  </Paper>
                </Box>
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderTop: '1px solid rgba(0,0,0,0.08)',
              backgroundColor: '#f7f7f7',
            }}
          >
            <Stack spacing={1}>
              <TextField
                id="embedded-ai-prompt"
                multiline
                minRows={2}
                maxRows={6}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder='Ex.: "Qual produto mais vendido?"'
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault()
                    void submit()
                  }
                }}
                sx={{ backgroundColor: '#fff', borderRadius: 2 }}
              />
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Use Ctrl+Enter para enviar rapidamente.
                </Typography>
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
                  {loading ? 'Enviando...' : 'Enviar'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export { EmbeddedAiModal }
