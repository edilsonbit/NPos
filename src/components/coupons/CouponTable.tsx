import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import HubIcon from '@mui/icons-material/Hub'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import LockIcon from '@mui/icons-material/Lock'
import dayjs from 'dayjs'
import Swal from 'sweetalert2'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Coupon, CouponStatus } from '../../domain/models'
import { useLanguage } from '../../i18n/LanguageContext'

type SortDir = 'asc' | 'desc'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// Agrupamento
interface CouponGroup {
  key: string
  couponNumber: string
  nsu: string
  storeId: string
  acquirer: string
  paymentMethod: string
  status: CouponStatus
  situacao?: string
  createdAt: string
  items: Coupon[]
  total: number
  totalTax: number
  itemCount: number
}

function groupCoupons(coupons: Coupon[]): CouponGroup[] {
  const map = new Map<string, CouponGroup>()
  for (const c of coupons) {
    const key = `${c.couponNumber}|${c.storeId}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        couponNumber: c.couponNumber,
        nsu: c.nsu,
        storeId: c.storeId,
        acquirer: c.acquirer,
        paymentMethod: c.paymentMethod,
        status: c.status,
        situacao: c.situacao,
        createdAt: c.createdAt,
        items: [],
        total: 0,
        totalTax: 0,
        itemCount: 0,
      })
    }
    const g = map.get(key)!
    g.items.push(c)
    g.total += c.amount
    g.totalTax += c.tax
    g.itemCount += 1
  }
  return Array.from(map.values())
}

// Linha expansível
interface GroupRowProps {
  group: CouponGroup
  open: boolean
  onToggle: () => void
  colCount: number
  onViewJson: (group: CouponGroup) => void
  selected: boolean
  onSelect: () => void
  locked: boolean
  isCancelledOnly?: boolean
}

function statusChip(status: string, tStatus: { authorized: string; cancelled: string }) {
  const isAutorizado = status === 'autorizado'
  return (
    <Chip
      size="small"
      label={isAutorizado ? tStatus.authorized : tStatus.cancelled}
      sx={{
        fontSize: 10,
        fontWeight: 700,
        height: 20,
        backgroundColor: isAutorizado ? '#e8f5e9' : '#ffebee',
        color: isAutorizado ? '#2e7d32' : '#c62828',
      }}
    />
  )
}

function situacaoChip(situacao: string | undefined, tStatus: { aggregated: string; sentToERP: string }) {
  if (situacao === 'Agregado') {
    return <Chip size="small" label={tStatus.aggregated} sx={{ fontSize: 10, fontWeight: 700, height: 20, backgroundColor: '#fff3e0', color: '#e65100' }} />
  }
  if (situacao === 'Enviado ao ERP') {
    return <Chip size="small" label={tStatus.sentToERP} sx={{ fontSize: 10, fontWeight: 700, height: 20, backgroundColor: '#e8f5e9', color: '#2e7d32' }} />
  }
  return null
}

function isLocked(situacao?: string) {
  return situacao === 'Agregado' || situacao === 'Enviado ao ERP'
}

// Modal JSON do cupom
interface CouponJsonDialogProps {
  open: boolean
  group: CouponGroup | null
  onClose: () => void
}

function CouponJsonDialog({ open, group, onClose }: CouponJsonDialogProps) {
  if (!group) return null

  const json = JSON.stringify({
    couponNumber: group.couponNumber,
    nsu: group.nsu,
    storeId: group.storeId,
    acquirer: group.acquirer,
    paymentMethod: group.paymentMethod,
    status: group.status,
    createdAt: group.createdAt,
    totalAmount: group.total,
    totalTax: group.totalTax,
    itemCount: group.itemCount,
    items: group.items.map((i) => ({
      id: i.id,
      productCode: i.productCode,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      tax: i.tax,
      amount: i.amount,
    })),
  }, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(json)
    Swal.fire({
      toast: true,
      position: 'bottom',
      icon: 'success',
      title: 'JSON copiado para a área de transferência!',
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      didOpen: (toast) => {
        const container = toast.closest('.swal2-container') as HTMLElement | null
        if (container) container.style.zIndex = '99999'
      },
    })
  }

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cupom-${group.couponNumber}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
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
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <VisibilityIcon sx={{ fontSize: 18 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
              Cupom {group.couponNumber}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.2 }}>
              {group.storeId} · {group.itemCount} produto(s)
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2.5 }}>
        <pre
          style={{
            backgroundColor: '#f0f4f8',
            border: '1px solid #e0e7ef',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 12,
            fontFamily: 'monospace',
            overflowX: 'auto',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: '#1c2536',
          }}
        >
          {json}
        </pre>
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            sx={{ textTransform: 'none', fontWeight: 600, flex: 1 }}
          >
            Copiar JSON
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ textTransform: 'none', fontWeight: 600, flex: 1, backgroundColor: '#0d3b45', '&:hover': { backgroundColor: '#062930' } }}
          >
            Baixar JSON
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
    </>
  )
}

function GroupRow({ group, open, onToggle, onViewJson, selected, onSelect, locked, isCancelledOnly }: GroupRowProps) {
  const { t } = useLanguage()
  const tStatus = t.couponTable.status
  const tExp = t.couponTable.expand
  return (
    <>
      <TableRow
        sx={{
          backgroundColor: open ? '#f0f7ff' : locked ? '#fafafa' : 'inherit',
          '&:hover': { backgroundColor: locked ? '#f5f5f5' : '#f5f8ff' },
          opacity: group.status === 'cancelado' ? 0.55 : 1,
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            size="small"
            checked={selected}
            disabled={locked || (!isCancelledOnly && group.status === 'cancelado')}
            onChange={(e) => { e.stopPropagation(); onSelect() }}
            sx={{ p: 0.5 }}
          />
        </TableCell>
        <TableCell sx={{ width: 40, pr: 0 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggle() }}>
            {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            {locked && <LockIcon sx={{ fontSize: 12, color: '#9e9e9e' }} />}
            <span>{group.couponNumber}</span>
          </Stack>
        </TableCell>
        <TableCell sx={{ fontSize: 12 }}>{group.nsu}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{group.storeId}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{group.acquirer}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>{group.paymentMethod}</TableCell>
        <TableCell sx={{ fontSize: 12 }}>
          <Tooltip title={`${group.itemCount} produto(s)`}>
            <Chip
              size="small"
              label={group.itemCount}
              sx={{ fontSize: 10, fontWeight: 700, height: 20, backgroundColor: '#f3e5f5', color: '#6a1b9a' }}
            />
          </Tooltip>
        </TableCell>
        <TableCell sx={{ fontSize: 12 }}>{currency.format(group.totalTax)}</TableCell>
        <TableCell sx={{ fontSize: 12, fontWeight: 700, color: '#0d3b45' }}>{currency.format(group.total)}</TableCell>
        <TableCell>{statusChip(group.status, tStatus)}</TableCell>
        <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>{dayjs(group.createdAt).format('DD/MM/YYYY')}</TableCell>
        <TableCell>{situacaoChip(group.situacao, tStatus)}</TableCell>
        <TableCell>
          <Tooltip title="Visualizar JSON">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onViewJson(group) }}
              sx={{ color: '#546e7a', '&:hover': { color: '#0d3b45' } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      {/* Sub-linhas dos produtos */}
      <TableRow>
        <TableCell colSpan={14} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ backgroundColor: '#f9fbff', borderLeft: '3px solid #1976d2', mx: 2, mb: 1, borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#546e7a', py: 0.8, pl: 2 }}>{tExp.productCode}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#546e7a', py: 0.8 }}>{tExp.productName}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#546e7a', py: 0.8 }} align="right">{tExp.qty}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#546e7a', py: 0.8 }} align="right">{tExp.unitPrice}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#546e7a', py: 0.8 }} align="right">{tExp.tax}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#546e7a', py: 0.8 }} align="right">{tExp.value}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.items.map((item) => (
                    <TableRow key={item.id} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontSize: 11, pl: 2, py: 0.6 }}>{item.productCode}</TableCell>
                      <TableCell sx={{ fontSize: 11, py: 0.6, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.productName}
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, py: 0.6 }} align="right">{item.quantity}</TableCell>
                      <TableCell sx={{ fontSize: 11, py: 0.6 }} align="right">{currency.format(item.unitPrice)}</TableCell>
                      <TableCell sx={{ fontSize: 11, py: 0.6 }} align="right">{currency.format(item.tax)}</TableCell>
                      <TableCell sx={{ fontSize: 11, py: 0.6, fontWeight: 600 }} align="right">{currency.format(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

// Colunas do cabeçalho principal — geradas dentro do componente para suportar i18n

interface CouponTableProps {
  coupons: Coupon[]
  filteredCount: number
  filteredTotal: number
  onAggregate: (coupons: Coupon[]) => void
  processing: boolean
  filtering?: boolean
  isCancelledOnly?: boolean
}

const CouponTable = ({ coupons, filteredCount, filteredTotal, onAggregate, processing, filtering, isCancelledOnly }: CouponTableProps) => {
  const { t } = useLanguage()
  const col = t.couponTable.columns
  const headCells = [
    { id: '_expand', label: '', sortable: false },
    { id: 'couponNumber', label: col.couponNumber, sortable: true },
    { id: 'nsu', label: col.nsu, sortable: true },
    { id: 'storeId', label: col.storeId, sortable: true },
    { id: 'acquirer', label: col.acquirer, sortable: true },
    { id: 'paymentMethod', label: col.paymentMethod, sortable: true },
    { id: 'itemCount', label: col.items, sortable: true },
    { id: 'totalTax', label: col.tax, sortable: true },
    { id: 'total', label: col.totalValue, sortable: true },
    { id: 'status', label: col.status, sortable: true },
    { id: 'createdAt', label: col.date, sortable: true },
    { id: 'situacao', label: col.situation, sortable: false },
    { id: 'acao', label: col.action, sortable: false },
  ]
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set())
  const [jsonGroup, setJsonGroup] = useState<CouponGroup | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  // Rastrear mudança de página para resetar checkboxes quando mudar de isCancelledOnly
  const prevIsCancelledRef = useRef<boolean | undefined>(isCancelledOnly)
  useEffect(() => {
    // Na mudança de página (isCancelledOnly muda), reseta checkboxes
    if (prevIsCancelledRef.current !== undefined && prevIsCancelledRef.current !== isCancelledOnly) {
      setSelectedKeys(new Set())
    }
    prevIsCancelledRef.current = isCancelledOnly
  }, [isCancelledOnly])

  const handleSort = (fieldId: string) => {
    if (sortField === fieldId) {
      if (sortDir === 'asc') setSortDir('desc')
      else setSortField(null)
    } else {
      setSortField(fieldId)
      setSortDir('asc')
    }
    setPage(0)
  }

  const toggleRow = (key: string) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const groups = useMemo(() => groupCoupons(coupons), [coupons])

  const aggregatableGroups = useMemo(
    () => isCancelledOnly 
      ? groups 
      : groups.filter((g) => !isLocked(g.situacao) && g.status !== 'cancelado'),
    [groups, isCancelledOnly],
  )

  // Grupos que podem ser selecionados (não-locked e não-cancelados em página normal)
  const selectableGroups = useMemo(
    () => aggregatableGroups.filter((g) => !isLocked(g.situacao) && (isCancelledOnly || g.status !== 'cancelado')),
    [aggregatableGroups, isCancelledOnly],
  )

  const allSelected =
    selectableGroups.length > 0 && selectableGroups.every((g) => selectedKeys.has(g.key))
  const someSelected = aggregatableGroups.some((g) => selectedKeys.has(g.key))

  const handleToggleAll = () => {
    setSelectedKeys((prev) => {
      if (allSelected) return new Set()
      const next = new Set(prev)
      // Apenas adiciona grupos que não estão locked
      selectableGroups.forEach((g) => next.add(g.key))
      return next
    })
  }

  const handleToggleOne = (group: CouponGroup) => {
    if (isLocked(group.situacao) || (!isCancelledOnly && group.status === 'cancelado')) return

    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(group.key)) next.delete(group.key)
      else next.add(group.key)
      return next
    })
  }

  const selectedGroups = useMemo(
    () => aggregatableGroups.filter((g) => selectedKeys.has(g.key)),
    [aggregatableGroups, selectedKeys],
  )

  const selectedCoupons = useMemo(
    () => selectedGroups.flatMap((g) => g.items),
    [selectedGroups],
  )

  const handleAggregateClick = async () => {
    if (!selectedCoupons.length || processing) return

    const isCancelled = isCancelledOnly
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmação',
      html: isCancelled 
        ? 'Deseja registrar os cupons cancelados ao ERP?'
        : 'Deseja seguir com a agregação do(s) cupom(s)?<br/><br/><span style="font-size:12px;color:#9e9e9e">Obs: Cupons com status de <strong style="color:#d32f2f">Cancelado</strong> não serão agregados.</span>',
      showCancelButton: true,
      confirmButtonText: isCancelled ? 'Sim, registrar' : 'Sim, agregar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d3b45',
      cancelButtonColor: '#757575',
      reverseButtons: true,
    })

    if (result.isConfirmed) {
      onAggregate(selectedCoupons)
    }
  }

  const sortedGroups = useMemo(() => {
    if (!sortField) return groups
    return [...groups].sort((a, b) => {
      const aVal = a[sortField as keyof CouponGroup]
      const bVal = b[sortField as keyof CouponGroup]
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal ?? '').localeCompare(String(bVal ?? ''))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [groups, sortField, sortDir])

  const pageGroups = sortedGroups.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Box>
      {/* Toolbar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.25, sm: 1 },
          gap: 1,
          borderBottom: '1px solid #e8ecf0',
          backgroundColor: '#fafbfc',
        }}
      >
        <Chip
          size="small"
          label={`${groups.length} cupons (${filteredCount} itens) | ${currency.format(filteredTotal)}`}
          sx={{
            backgroundColor: '#e3f0ff',
            color: '#1565c0',
            fontWeight: 600,
            height: 28,
            borderRadius: 1,
            maxWidth: { xs: '100%', sm: 'unset' },
            '& .MuiChip-label': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
          }}
        />
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
          {someSelected && (
            <Chip
              size="small"
              label={`${selectedGroups.length} selecionado(s)`}
              onDelete={() => setSelectedKeys(new Set())}
              sx={{ backgroundColor: '#fff3e0', color: '#e65100', fontWeight: 600, height: 28, borderRadius: 1 }}
            />
          )}
          <Button
            variant="contained"
            startIcon={<HubIcon />}
            onClick={() => void handleAggregateClick()}
            disabled={processing || selectedCoupons.length === 0}
            sx={{
              backgroundColor: '#0d3b45',
              '&:hover': { backgroundColor: '#062930' },
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              height: 36,
              fontSize: 13,
              whiteSpace: 'nowrap',
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 1.5,
            }}
          >
            {isCancelledOnly ? (
              processing ? 'Registrando...' : `Enviar Cancelados ao ERP${selectedGroups.length > 0 ? ` (${selectedGroups.length})` : ''}`
            ) : (
              processing ? 'Agrupando...' : `Agregar Cupons${selectedGroups.length > 0 ? ` (${selectedGroups.length})` : ''}`
            )}
          </Button>
        </Stack>
      </Stack>
      {filtering && (
        <LinearProgress sx={{ height: 3, backgroundColor: '#e3f0ff', '& .MuiLinearProgress-bar': { backgroundColor: '#1976d2' } }} />
      )}
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell
                padding="checkbox"
                sx={{ backgroundColor: '#1c2536', borderBottom: 'none' }}
              >
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onChange={handleToggleAll}
                  disabled={aggregatableGroups.length === 0}
                  sx={{
                    p: 0.5,
                    color: '#ffffff',
                    '& .MuiSvgIcon-root': { color: '#ffffff' },
                    '&.Mui-checked': { color: '#90caf9' },
                    '&.MuiCheckbox-indeterminate': { color: '#90caf9' },
                  }}
                />
              </TableCell>
              {headCells.map((cell) => (
                <TableCell
                  key={cell.id}
                  sortDirection={sortField === cell.id ? sortDir : false}
                  sx={{
                    fontWeight: 600,
                    fontSize: 12,
                    backgroundColor: '#1c2536',
                    color: '#fff',
                    borderBottom: 'none',
                    whiteSpace: 'nowrap',
                    py: 1.5,
                    '&.MuiTableCell-stickyHeader': { backgroundColor: '#1c2536' },
                  }}
                >
                  {cell.sortable ? (
                    <TableSortLabel
                      active={sortField === cell.id}
                      direction={sortField === cell.id ? sortDir : 'asc'}
                      onClick={() => handleSort(cell.id)}
                      sx={{
                        color: '#fff !important',
                        '&.Mui-active': { color: '#90caf9 !important' },
                        '& .MuiTableSortLabel-icon': { color: '#90caf9 !important' },
                      }}
                    >
                      {cell.label}
                    </TableSortLabel>
                  ) : (
                    cell.label || null
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headCells.length + 1} align="center" sx={{ py: 6, color: '#9e9e9e', fontSize: 13 }}>
                  Nenhum cupom encontrado
                </TableCell>
              </TableRow>
            ) : (
              pageGroups.map((group) => (
                <GroupRow
                  key={group.key}
                  group={group}
                  open={openKeys.has(group.key)}
                  onToggle={() => toggleRow(group.key)}
                  colCount={headCells.length}
                  onViewJson={(g) => setJsonGroup(g)}
                  selected={selectedKeys.has(group.key)}
                  onSelect={() => handleToggleOne(group)}
                  locked={isLocked(group.situacao)}
                  isCancelledOnly={isCancelledOnly}
                />
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                colSpan={headCells.length + 1}
                count={groups.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10))
                  setPage(0)
                }}
                labelRowsPerPage="Cupons por página"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                }
                sx={{
                  borderTop: '1px solid #e8ecf0',
                  '& .MuiTablePagination-toolbar': { fontSize: 12 },
                  '& .MuiTablePagination-selectLabel': { fontSize: 12 },
                  '& .MuiTablePagination-displayedRows': { fontSize: 12 },
                }}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      {groups.length === 0 && (
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', p: 1, color: '#9e9e9e' }}>
          Nenhum registro
        </Typography>
      )}
      <CouponJsonDialog
        open={Boolean(jsonGroup)}
        group={jsonGroup}
        onClose={() => setJsonGroup(null)}
      />
    </Box>
  )
}

export { CouponTable }

