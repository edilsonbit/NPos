import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined'
import HubIcon from '@mui/icons-material/Hub'
import RefreshIcon from '@mui/icons-material/Refresh'
import SendIcon from '@mui/icons-material/Send'
import UndoIcon from '@mui/icons-material/Undo'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useMemo, useState } from 'react'
import type { ActivityLog, ActivityLogAction } from '../../domain/models'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

interface IntegrationAlertsPageProps {
  logs: ActivityLog[]
  loading?: boolean
  onRefresh: () => void
}

const actionConfig: Record<
  ActivityLogAction,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  AGREGAR_CUPONS: {
    label: 'Agregar Cupons',
    color: '#1565c0',
    bg: '#e3f0ff',
    icon: <HubIcon sx={{ fontSize: 14 }} />,
  },
  DESFAZER_AGREGACAO: {
    label: 'Desfazer Agregacao',
    color: '#c62828',
    bg: '#ffebee',
    icon: <UndoIcon sx={{ fontSize: 14 }} />,
  },
  ENVIAR_ERP: {
    label: 'Enviar ao ERP',
    color: '#e65100',
    bg: '#fff3e0',
    icon: <SendIcon sx={{ fontSize: 14 }} />,
  },
  CANCELAR_CUPOM: {
    label: 'Cancelar Cupom',
    color: '#6a1b9a',
    bg: '#f3e5f5',
    icon: <ErrorOutlinedIcon sx={{ fontSize: 14 }} />,
  },
}

const IntegrationAlertsPage = ({ logs, loading = false, onRefresh }: IntegrationAlertsPageProps) => {
  const [actionFilter, setActionFilter] = useState<ActivityLogAction | ''>('')
  const [statusFilter, setStatusFilter] = useState<'sucesso' | 'erro' | ''>('')
  const [searchFilter, setSearchFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchAction = !actionFilter || log.action === actionFilter
      const matchStatus = !statusFilter || log.status === statusFilter
      const matchSearch =
        !searchFilter ||
        log.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (log.userId ?? '').toLowerCase().includes(searchFilter.toLowerCase())
      return matchAction && matchStatus && matchSearch
    })
  }, [logs, actionFilter, statusFilter, searchFilter])

  const countSuccess = useMemo(() => logs.filter((l) => l.status === 'sucesso').length, [logs])
  const countError = useMemo(() => logs.filter((l) => l.status === 'erro').length, [logs])

  return (
    <>
      <Paper
        elevation={0}
        sx={{ borderRadius: 2, border: '1px solid #e8ecf0', overflow: 'hidden', backgroundColor: '#fff' }}
      >
        {/* Toolbar — título + contadores + refresh */}
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            borderBottom: '1px solid #e8ecf0',
            backgroundColor: '#fafbfc',
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <WarningAmberIcon sx={{ color: '#ef6c00', fontSize: 22 }} />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1a2c3d', lineHeight: 1.2 }}>
                Alerta das Integracoes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Log geral de todas as operacoes realizadas no sistema
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              icon={<CheckCircleOutlinedIcon sx={{ fontSize: 14 }} />}
              label={`${countSuccess} sucesso(s)`}
              size="small"
              sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, height: 28, borderRadius: 1 }}
            />
            <Chip
              icon={<ErrorOutlinedIcon sx={{ fontSize: 14 }} />}
              label={`${countError} erro(s)`}
              size="small"
              sx={{ backgroundColor: '#ffebee', color: '#c62828', fontWeight: 600, height: 28, borderRadius: 1 }}
            />
            <Tooltip title="Atualizar logs">
              <IconButton size="small" onClick={onRefresh} disabled={loading} sx={{ color: '#1976d2' }}>
                {loading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Filtros */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e8ecf0' }}>
          <Stack direction="row" spacing={1.5}>
            <TextField
              select
              size="small"
              label="Acao"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as ActivityLogAction | '')}
              sx={{ flex: 1, minWidth: 160 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {(Object.keys(actionConfig) as ActivityLogAction[]).map((key) => (
                <MenuItem key={key} value={key}>{actionConfig[key].label}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'sucesso' | 'erro' | '')}
              sx={{ flex: 1, minWidth: 120 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="sucesso">Sucesso</MenuItem>
              <MenuItem value="erro">Erro</MenuItem>
            </TextField>

            <TextField
              size="small"
              label="Buscar por descricao ou usuario"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              sx={{ flex: 3 }}
            />
          </Stack>
        </Box>

        {/* Tabela */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Data / Hora', 'Acao', 'Descricao', 'Usuario', 'Status', 'Ver'].map((label, i) => (
                  <TableCell
                    key={label}
                    align={i >= 4 ? 'center' : 'left'}
                    sx={{
                      fontWeight: 600,
                      fontSize: 12,
                      backgroundColor: '#1c2536',
                      color: '#fff',
                      borderBottom: 'none',
                      whiteSpace: 'nowrap',
                      py: 1.5,
                      width: i === 0 ? 160 : i === 1 ? 180 : i === 4 ? 100 : i === 5 ? 60 : undefined,
                    }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#9e9e9e', fontSize: 13 }}>
                    <CircularProgress size={28} sx={{ color: '#1976d2' }} />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#9e9e9e', fontSize: 13 }}>
                    {logs.length === 0
                      ? 'Nenhuma operacao registrada ainda. As acoes realizadas no sistema aparecerao aqui.'
                      : 'Nenhum log encontrado para os filtros aplicados.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const cfg = actionConfig[log.action]
                  return (
                    <TableRow
                      key={log.id ?? log.timestamp}
                      hover
                      sx={{
                        borderLeft: `3px solid ${log.status === 'erro' ? '#c62828' : '#4caf50'}`,
                        '&:hover': { backgroundColor: '#f5f8ff' },
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, fontSize: 12 }}>
                          {dayjs(log.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(log.timestamp).fromNow()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={cfg.icon as React.ReactElement}
                          label={cfg.label}
                          sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: 11, height: 22 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{log.description}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: '#546e7a' }}>{log.userId ?? '\u2014'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={log.status === 'sucesso' ? 'Sucesso' : 'Erro'}
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            height: 20,
                            backgroundColor: log.status === 'sucesso' ? '#e8f5e9' : '#ffebee',
                            color: log.status === 'sucesso' ? '#2e7d32' : '#c62828',
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ver detalhes">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedLog(log)}
                            sx={{ color: '#546e7a', '&:hover': { color: '#0d3b45' } }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredLogs.length > 0 && (
          <Box sx={{ px: 2, py: 1, borderTop: '1px solid #e8ecf0', backgroundColor: '#fafbfc' }}>
            <Typography variant="caption" color="text.secondary">
              Exibindo {filteredLogs.length} de {logs.length} registros
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Modal de detalhes */}
      <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #e8ecf0', pb: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {selectedLog && actionConfig[selectedLog.action].icon}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {selectedLog ? actionConfig[selectedLog.action].label : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedLog ? dayjs(selectedLog.timestamp).format('DD/MM/YYYY HH:mm:ss') : ''}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5, pb: 1 }}>
          {selectedLog && (
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, backgroundColor: '#f8fafc', borderRadius: 1.5, p: 2, border: '1px solid #e8ecf0' }}>
                {[
                  { label: 'Status', value: selectedLog.status === 'sucesso' ? 'Sucesso' : 'Erro' },
                  { label: 'Usuario', value: selectedLog.userId ?? '\u2014' },
                  { label: 'Data / Hora', value: dayjs(selectedLog.timestamp).format('DD/MM/YYYY HH:mm:ss') },
                  { label: 'Ha quanto tempo', value: dayjs(selectedLog.timestamp).fromNow() },
                ].map(({ label, value }) => (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>{label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>Descricao</Typography>
                <Typography variant="body2">{selectedLog.description}</Typography>
              </Box>
              {selectedLog.details && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a2c3d', mb: 1 }}>Detalhes</Typography>
                    <Stack spacing={1}>
                      {selectedLog.details.count !== undefined && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Quantidade</Typography>
                          <Typography variant="body2">{selectedLog.details.count}</Typography>
                        </Box>
                      )}
                      {selectedLog.details.groupIds && selectedLog.details.groupIds.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Grupos ({selectedLog.details.groupIds.length})
                          </Typography>
                          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {selectedLog.details.groupIds.map((id) => (
                              <Chip key={id} size="small" label={id} sx={{ backgroundColor: '#e8eaf6', color: '#3949ab', fontSize: 11 }} />
                            ))}
                          </Stack>
                        </Box>
                      )}
                      {selectedLog.details.couponNumbers && selectedLog.details.couponNumbers.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Cupons ({selectedLog.details.couponNumbers.length})
                          </Typography>
                          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {selectedLog.details.couponNumbers.slice(0, 20).map((n) => (
                              <Chip key={n} size="small" label={n} sx={{ backgroundColor: '#e3f0ff', color: '#1565c0', fontSize: 11 }} />
                            ))}
                            {selectedLog.details.couponNumbers.length > 20 && (
                              <Chip size="small" label={`+${selectedLog.details.couponNumbers.length - 20} mais`} sx={{ backgroundColor: '#f5f5f5', color: '#757575', fontSize: 11 }} />
                            )}
                          </Stack>
                        </Box>
                      )}
                      {selectedLog.details.errorMessage && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>Mensagem de Erro</Typography>
                          <Box sx={{ backgroundColor: '#ffebee', borderRadius: 1, p: 1.5, border: '1px solid #ffcdd2' }}>
                            <Typography variant="body2" sx={{ color: '#c62828', fontFamily: 'monospace', fontSize: 12 }}>
                              {selectedLog.details.errorMessage}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e8ecf0', px: 3, py: 1.5 }}>
          <Button onClick={() => setSelectedLog(null)} variant="outlined" sx={{ textTransform: 'none' }}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export { IntegrationAlertsPage }
