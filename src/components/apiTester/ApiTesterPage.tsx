import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import SendIcon from '@mui/icons-material/Send'
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'

const FIREBASE_KEY = 'AIzaSyCSugFTAyZBQAiaixEq0TIlGevf1y2T3sk'
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/ics-npos/databases/(default)/documents`

type HeaderPair = { key: string; value: string }
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ResponseState {
  status: number
  statusText: string
  time: number
  body: string
}

const EXAMPLES = [
  {
    label: 'Listar Cupons',
    method: 'GET' as HttpMethod,
    url: `${FIRESTORE_BASE}/coupons?key=${FIREBASE_KEY}&pageSize=10`,
    headers: [] as HeaderPair[],
    body: '',
  },
  {
    label: 'Inserir Cupom',
    method: 'POST' as HttpMethod,
    url: `${FIRESTORE_BASE}/coupons?key=${FIREBASE_KEY}`,
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: JSON.stringify(
      {
        fields: {
          id: { stringValue: 'CUP-TEST-001' },
          couponNumber: { stringValue: 'CUP-TEST-001' },
          nsu: { stringValue: 'NSU-77777' },
          storeId: { stringValue: 'LOJA-01' },
          acquirer: { stringValue: 'CIELO' },
          paymentMethod: { stringValue: 'CREDITO' },
          status: { stringValue: 'autorizado' },
          createdAt: { stringValue: new Date().toISOString() },
          productId: { stringValue: 'PROD-001' },
          productCode: { stringValue: 'PROD-001' },
          productName: { stringValue: 'Produto Teste API' },
          quantity: { integerValue: '1' },
          unitPrice: { doubleValue: 150.0 },
          tax: { doubleValue: 7.5 },
          amount: { doubleValue: 157.5 },
        },
      },
      null,
      2,
    ),
  },
]

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#2e7d32',
  POST: '#1565c0',
  PUT: '#e65100',
  PATCH: '#6a1b9a',
  DELETE: '#c62828',
}

const statusColor = (status: number) => {
  if (status >= 200 && status < 300) return '#2e7d32'
  if (status >= 400 && status < 500) return '#e65100'
  return '#c62828'
}

const ApiTesterPage = () => {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState(`${FIRESTORE_BASE}/coupons?key=${FIREBASE_KEY}&pageSize=10`)
  const [headers, setHeaders] = useState<HeaderPair[]>([])
  const [body, setBody] = useState('')
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ResponseState | null>(null)
  const [copied, setCopied] = useState(false)

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method)

  const addHeader = () => setHeaders((h) => [...h, { key: '', value: '' }])
  const removeHeader = (i: number) => setHeaders((h) => h.filter((_, idx) => idx !== i))
  const updateHeader = (i: number, field: 'key' | 'value', val: string) =>
    setHeaders((h) => h.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)))

  const applyExample = (ex: (typeof EXAMPLES)[number]) => {
    setMethod(ex.method)
    setUrl(ex.url)
    setHeaders(ex.headers)
    setBody(ex.body)
    if (ex.body) setTab(1)
    else setTab(0)
    setResponse(null)
  }

  const send = async () => {
    setLoading(true)
    setResponse(null)
    const start = performance.now()
    try {
      const reqHeaders: Record<string, string> = {}
      headers.filter((h) => h.key).forEach((h) => (reqHeaders[h.key] = h.value))

      const res = await fetch(url, {
        method,
        headers: reqHeaders,
        body: hasBody && body ? body : undefined,
      })
      const elapsed = Math.round(performance.now() - start)
      let text = await res.text()
      try {
        text = JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        // não é JSON, mantém como está
      }
      setResponse({ status: res.status, statusText: res.statusText, time: elapsed, body: text })
    } catch (e) {
      const elapsed = Math.round(performance.now() - start)
      setResponse({ status: 0, statusText: 'Erro de rede', time: elapsed, body: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const copyResponse = () => {
    if (response) {
      void navigator.clipboard.writeText(response.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      {/* Título */}
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1c2536', mb: 0.5 }}>
        API Tester
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Teste requisições à API do Firestore diretamente pelo sistema.
      </Typography>

      {/* Exemplos rápidos */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ alignSelf: 'center', color: '#9e9e9e', fontWeight: 600 }}>
          EXEMPLOS:
        </Typography>
        {EXAMPLES.map((ex) => (
          <Chip
            key={ex.label}
            label={ex.label}
            size="small"
            onClick={() => applyExample(ex)}
            sx={{
              backgroundColor: '#e3f0ff',
              color: '#1565c0',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': { backgroundColor: '#bbdefb' },
            }}
          />
        ))}
      </Stack>

      <Paper elevation={0} sx={{ border: '1px solid #e8ecf0', borderRadius: 2, overflow: 'hidden' }}>
        {/* Barra de URL */}
        <Stack direction="row" sx={{ borderBottom: '1px solid #e8ecf0', p: 1.5, gap: 1 }}>
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            size="small"
            sx={{
              minWidth: 100,
              fontWeight: 700,
              fontSize: 13,
              color: METHOD_COLORS[method],
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8ecf0' },
            }}
          >
            {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
              <MenuItem key={m} value={m} sx={{ fontWeight: 700, color: METHOD_COLORS[m], fontSize: 13 }}>
                {m}
              </MenuItem>
            ))}
          </Select>

          <TextField
            fullWidth
            size="small"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            sx={{ '& .MuiOutlinedInput-root': { fontSize: 13 } }}
          />

          <Button
            variant="contained"
            onClick={() => void send()}
            disabled={loading || !url}
            startIcon={<SendIcon sx={{ fontSize: 16 }} />}
            sx={{
              backgroundColor: '#1c2536',
              '&:hover': { backgroundColor: '#0d3b45' },
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 100,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </Stack>

        {/* Tabs: Headers / Body */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as number)}
          sx={{ borderBottom: '1px solid #e8ecf0', minHeight: 36, '& .MuiTab-root': { fontSize: 12, minHeight: 36, textTransform: 'none' } }}
        >
          <Tab label={`Headers${headers.length ? ` (${headers.length})` : ''}`} />
          {hasBody && <Tab label="Body" />}
        </Tabs>

        <Box sx={{ p: 2, minHeight: 140 }}>
          {tab === 0 && (
            <Stack spacing={1}>
              {headers.map((h, i) => (
                <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Key"
                    value={h.key}
                    onChange={(e) => updateHeader(i, 'key', e.target.value)}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontSize: 12 } }}
                  />
                  <TextField
                    size="small"
                    placeholder="Value"
                    value={h.value}
                    onChange={(e) => updateHeader(i, 'value', e.target.value)}
                    sx={{ flex: 2, '& .MuiOutlinedInput-root': { fontSize: 12 } }}
                  />
                  <IconButton size="small" onClick={() => removeHeader(i)} sx={{ color: '#e57373' }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              ))}
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={addHeader}
                sx={{ alignSelf: 'flex-start', textTransform: 'none', fontSize: 12, color: '#1976d2' }}
              >
                Adicionar header
              </Button>
            </Stack>
          )}
          {tab === 1 && hasBody && (
            <TextField
              fullWidth
              multiline
              minRows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{ "fields": { ... } }'
              sx={{ '& .MuiOutlinedInput-root': { fontSize: 12, fontFamily: 'monospace' } }}
            />
          )}
        </Box>

        {/* Resposta */}
        {response !== null && (
          <>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#9e9e9e', letterSpacing: 0.5 }}>
                    RESPOSTA
                  </Typography>
                  <Chip
                    size="small"
                    label={response.status === 0 ? 'Erro' : `${response.status} ${response.statusText}`}
                    sx={{
                      fontWeight: 700,
                      fontSize: 11,
                      height: 20,
                      backgroundColor: response.status === 0 ? '#ffebee' : response.status < 300 ? '#e8f5e9' : '#ffebee',
                      color: response.status === 0 ? '#c62828' : statusColor(response.status),
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
                    {response.time}ms
                  </Typography>
                </Stack>
                <Tooltip title={copied ? 'Copiado!' : 'Copiar resposta'}>
                  <IconButton size="small" onClick={copyResponse}>
                    <ContentCopyIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e8ecf0',
                  borderRadius: 1,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  maxHeight: 400,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: '#1c2536',
                }}
              >
                {response.body}
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}

export { ApiTesterPage }
