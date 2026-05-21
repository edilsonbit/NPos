import {
  Box,
  Button,
  Checkbox,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableFooter,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import HubIcon from '@mui/icons-material/Hub'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import SendIcon from '@mui/icons-material/Send'
import UndoIcon from '@mui/icons-material/Undo'
import dayjs from 'dayjs'
import Swal from 'sweetalert2'
import { useMemo, useState } from 'react'
import type { AggregatedCouponGroup, AggregationCriteria, GroupFilters } from '../../domain/models'
import { AggregatedView } from './AggregatedView'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const defaultFilters: GroupFilters = {
  idAgregador: '',
  couponNumber: '',
  storeId: '',
  acquirer: '',
  paymentMethod: '',
  productSearch: '',
  dateFrom: '',
  dateTo: '',
}

interface AgregadorPageProps {
  groups: AggregatedCouponGroup[]
  criteria: AggregationCriteria
  onGoToCupons: () => void
  onSendToErp?: (groupIds: string[]) => Promise<void>
  onUndoAggregation?: (groupId: string) => Promise<void>
  onUndoAggregationByNumbers?: (couponNumbers: string[]) => Promise<void>
}

const AgregadorPage = ({ groups, criteria, onGoToCupons: _onGoToCupons, onSendToErp, onUndoAggregation, onUndoAggregationByNumbers }: AgregadorPageProps) => {
  const [pendingFilters, setPendingFilters] = useState<GroupFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<GroupFilters>(defaultFilters)
  const [searching, setSearching] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
  const [sendingToErp, setSendingToErp] = useState(false)

  const triggerSearch = (newFilters: GroupFilters) => {
    setSearching(true)
    setPage(0) // Reset para primeira página quando filtro muda
    setTimeout(() => {
      setAppliedFilters(newFilters)
      setSearching(false)
    }, 500)
  }

  const setField = <K extends keyof GroupFilters>(key: K, value: GroupFilters[K]) =>
    setPendingFilters((prev) => ({ ...prev, [key]: value }))

  // Selects e datas: atualiza pending E aplica imediatamente com loading
  const setInstantField = <K extends keyof GroupFilters>(key: K, value: GroupFilters[K]) => {
    const newFilters = { ...pendingFilters, [key]: value }
    setPendingFilters(newFilters)
    triggerSearch(newFilters)
  }

  const handleSearch = () => triggerSearch(pendingFilters)

  const handleClear = () => {
    setPendingFilters(defaultFilters)
    triggerSearch(defaultFilters)
  }

  const stores = useMemo(() => [...new Set(groups.map((g) => g.storeId))].sort(), [groups])
  const acquirers = useMemo(() => [...new Set(groups.map((g) => g.acquirer))].sort(), [groups])
  const payMethods = useMemo(() => [...new Set(groups.map((g) => g.paymentMethod))].sort(), [groups])

  const filtered = useMemo(() => {
    const f = appliedFilters
    return groups.filter((g) => {
      const matchId = !f.idAgregador || g.idAgregador.toLowerCase().includes(f.idAgregador.toLowerCase())
      const matchNF = !f.couponNumber || g.coupons.some((c) => c.couponNumber.toLowerCase().includes(f.couponNumber.toLowerCase()))
      const matchStore = !f.storeId || g.storeId === f.storeId
      const matchAcquirer = !f.acquirer || g.acquirer === f.acquirer
      const matchPayment = !f.paymentMethod || g.paymentMethod === f.paymentMethod
      const matchProduct =
        !f.productSearch ||
        g.productCode.toLowerCase().includes(f.productSearch.toLowerCase()) ||
        g.productName.toLowerCase().includes(f.productSearch.toLowerCase())
      const matchFrom = !f.dateFrom || dayjs(g.date).isAfter(dayjs(f.dateFrom).subtract(1, 'day'))
      const matchTo = !f.dateTo || dayjs(g.date).isBefore(dayjs(f.dateTo).add(1, 'day'))
      return matchId && matchNF && matchStore && matchAcquirer && matchPayment && matchProduct && matchFrom && matchTo
    })
  }, [groups, appliedFilters])

  const totalAgregado = useMemo(() => filtered.reduce((acc, g) => acc + g.totalAmount, 0), [filtered])
  const totalCupons = useMemo(() => filtered.reduce((acc, g) => acc + g.coupons.length, 0), [filtered])

  // Paginação com TablePagination
  const paginatedGroups = useMemo(() => {
    return filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [filtered, page, rowsPerPage])

  // Gerenciar seleção de grupos
  const allGroupsSelected = paginatedGroups.length > 0 && paginatedGroups.every((g) => selectedGroupIds.has(g.idAgregador))
  const someGroupsSelected = paginatedGroups.some((g) => selectedGroupIds.has(g.idAgregador))

  const handleToggleGroup = (idAgregador: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(idAgregador)) next.delete(idAgregador)
      else next.add(idAgregador)
      return next
    })
  }

  const handleToggleAllGroups = () => {
    if (allGroupsSelected) {
      setSelectedGroupIds((prev) => {
        const next = new Set(prev)
        paginatedGroups.forEach((g) => next.delete(g.idAgregador))
        return next
      })
    } else {
      setSelectedGroupIds((prev) => {
        const next = new Set(prev)
        paginatedGroups.forEach((g) => next.add(g.idAgregador))
        return next
      })
    }
  }

  const handleSendToErp = async () => {
    if (!onSendToErp || selectedGroupIds.size === 0) return

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmação',
      html: `Deseja realmente enviar <strong>${selectedGroupIds.size} grupo(s)</strong> ao ERP?<br/><br/><span style="font-size:12px;color:#9e9e9e">Esta ação atualizará a situação dos cupons para <strong style="color:#0d3b45">Enviado ao ERP</strong> e não poderão ser desfeitas.</span>`,
      showCancelButton: true,
      confirmButtonText: 'Sim, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e65100',
      cancelButtonColor: '#757575',
      reverseButtons: true,
    })

    if (!result.isConfirmed) return

    setSendingToErp(true)
    try {
      await onSendToErp(Array.from(selectedGroupIds))
      setSelectedGroupIds(new Set())
    } finally {
      setSendingToErp(false)
    }
  }

    const handleUndoAggregation = async () => {
    if (selectedGroupIds.size === 0) return

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Desfazer Agregação',
      html: `Deseja realmente desfazer <strong>${selectedGroupIds.size} grupo(s)</strong> selecionado(s)?<br/><br/><span style="font-size:12px;color:#9e9e9e">A desagregação irá reverter a agregação de todos os itens dos cupons fiscais selecionados.</span>`,
      showCancelButton: true,
      confirmButtonText: 'Sim, desfazer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#757575',
      reverseButtons: true,
    })

    if (!result.isConfirmed) return

    try {
      const allCoupons = groups
        .filter(g => selectedGroupIds.has(g.idAgregador))
        .flatMap(g => g.coupons)
      
      const couponNumbers = allCoupons.map(c => c.couponNumber)

      if (onUndoAggregationByNumbers) {
        await onUndoAggregationByNumbers(couponNumbers)
      } else if (onUndoAggregation) {
        for (const groupId of selectedGroupIds) {
          await onUndoAggregation(groupId)
        }
      }
      
      setSelectedGroupIds(new Set())
    } catch (error) {
      console.error('Erro ao desfazer agregação:', error)
    }
  }

  // ...nenhuma lista mock, tela segue original...

  return (
    <Box sx={{ p: { xs: 0.5, md: 0 } }}>
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 2.5,
          border: '1px solid #e8ecf0',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          background: 'linear-gradient(135deg, #f7fbff 0%, #eff6ff 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', p: { xs: 1.5, md: 2 }, gap: 1.5 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a2c3d', lineHeight: 1.2 }}>
              Agregador — Visão Agrupada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Gerencie os grupos agregados e envie para o ERP com controle total.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip
              size="small"
              icon={<HubIcon sx={{ fontSize: 14 }} />}
              label={`${filtered.length} grupos`}
              sx={{ backgroundColor: '#e8eaf6', color: '#3949ab', fontWeight: 700 }}
            />
            <Chip
              size="small"
              label={`${totalCupons} cupons`}
              sx={{ backgroundColor: '#e3f0ff', color: '#1565c0', fontWeight: 700 }}
            />
            <Chip
              size="small"
              label={currency.format(totalAgregado)}
              sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Card: filtros dos grupos + accordion */}
      <Paper elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e8ecf0', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
        {/* Barra de filtros */}
        <Box sx={{ p: { xs: 1.25, sm: 2 }, borderBottom: '1px solid #e8ecf0', backgroundColor: '#fcfdff' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#445266', mb: 1.25 }}>
            Filtros de busca
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, minmax(0, 1fr))' },
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <TextField
              select size="small" label="Loja"
              value={pendingFilters.storeId}
              onChange={(e) => setInstantField('storeId', e.target.value)}
              sx={{ width: '100%' }}
            >
              <MenuItem value="">Todas</MenuItem>
              {stores.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>

            <TextField
              select size="small" label="Adquirente"
              value={pendingFilters.acquirer}
              onChange={(e) => setInstantField('acquirer', e.target.value)}
              sx={{ width: '100%' }}
            >
              <MenuItem value="">Todos</MenuItem>
              {acquirers.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>

            <TextField
              select size="small" label="Forma de Pagamento"
              value={pendingFilters.paymentMethod}
              onChange={(e) => setInstantField('paymentMethod', e.target.value)}
              sx={{ width: '100%', gridColumn: { xs: '1 / -1', md: 'auto' } }}
            >
              <MenuItem value="">Todas</MenuItem>
              {payMethods.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, minmax(0, 1fr))' },
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <DatePicker
              label="Data Início"
              format="DD/MM/YYYY"
              value={pendingFilters.dateFrom ? dayjs(pendingFilters.dateFrom) : null}
              onChange={(v) => setInstantField('dateFrom', v ? v.format('YYYY-MM-DD') : '')}
              slotProps={{ textField: { size: 'small', sx: { width: '100%' } } }}
            />
            <DatePicker
              label="Data Fim"
              format="DD/MM/YYYY"
              value={pendingFilters.dateTo ? dayjs(pendingFilters.dateTo) : null}
              onChange={(v) => setInstantField('dateTo', v ? v.format('YYYY-MM-DD') : '')}
              slotProps={{ textField: { size: 'small', sx: { width: '100%' } } }}
            />
            <TextField
              size="small" label="Nº do Cupom Fiscal"
              value={pendingFilters.couponNumber}
              onChange={(e) => setField('couponNumber', e.target.value)}
              sx={{ width: '100%' }}
            />
            <TextField
              size="small" label="IdAgregador"
              value={pendingFilters.idAgregador}
              onChange={(e) => setField('idAgregador', e.target.value)}
              sx={{ width: '100%' }}
            />
            <TextField
              size="small" label="Código / Nome do Produto"
              value={pendingFilters.productSearch}
              onChange={(e) => setField('productSearch', e.target.value)}
              sx={{ width: '100%', gridColumn: { xs: '1 / -1', md: 'auto' } }}
            />
          </Box>

          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr 1fr', sm: 'auto auto' }, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' },
                textTransform: 'none',
                fontWeight: 700,
                px: 2,
                height: 40,
                borderRadius: 1.5,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Pesquisar
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              sx={{
                borderColor: '#d0d7de',
                color: '#59636e',
                '&:hover': { borderColor: '#b8c0ca', backgroundColor: '#f5f7fa' },
                textTransform: 'none',
                fontWeight: 700,
                px: 2,
                height: 40,
                borderRadius: 1.5,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Limpar
            </Button>
          </Box>
        </Box>

        {/* LinearProgress durante o filtro */}
        {searching && (
          <LinearProgress sx={{ height: 3, backgroundColor: '#e3f0ff', '& .MuiLinearProgress-bar': { backgroundColor: '#1976d2' } }} />
        )}

        {/* Lista de grupos em accordion */}
        <Box sx={{ p: { xs: 1.25, md: 2 } }}>
          {filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography color="text.secondary" variant="body2">
                Nenhum grupo encontrado para os filtros aplicados.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Barra de ações acima da lista */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{
                  mb: 2,
                  p: 1,
                  border: '1px solid #e8ecf0',
                  borderRadius: 2,
                  backgroundColor: '#fbfcfe',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  justifyContent: 'space-between',
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Checkbox
                    size="small"
                    checked={allGroupsSelected}
                    indeterminate={!allGroupsSelected && someGroupsSelected}
                    onChange={handleToggleAllGroups}
                  />
                  <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 600 }}>
                    {selectedGroupIds.size > 0 ? `${selectedGroupIds.size} selecionado(s)` : 'Selecionar tudo'}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSendToErp}
                    disabled={selectedGroupIds.size === 0 || sendingToErp}
                    sx={{
                      backgroundColor: '#e65100',
                      '&:hover': { backgroundColor: '#bf360c' },
                      '&:disabled': { backgroundColor: '#ccc', color: '#999' },
                      textTransform: 'none',
                      fontWeight: 700,
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    {sendingToErp ? 'Enviando...' : 'Enviar para o ERP'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UndoIcon />}
                    onClick={handleUndoAggregation}
                    disabled={selectedGroupIds.size === 0}
                    sx={{
                      borderColor: '#d32f2f',
                      color: '#d32f2f',
                      '&:hover': { borderColor: '#b71c1c', backgroundColor: 'rgba(211, 47, 47, 0.04)' },
                      '&:disabled': { borderColor: '#ccc', color: '#999' },
                      textTransform: 'none',
                      fontWeight: 700,
                      width: { xs: '100%', sm: 'auto' },
                    }}
                  >
                    Desfazer Agregação
                  </Button>
                </Stack>
              </Stack>

              <AggregatedView 
                groups={paginatedGroups} 
                criteria={criteria}
                selectedGroupIds={selectedGroupIds}
                onSelectGroup={handleToggleGroup}
              />

              {/* TablePagination */}
              <Table sx={{ mt: 2, border: '1px solid #e8ecf0', borderRadius: 1.5 }}>
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      colSpan={6}
                      count={filtered.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={(_, newPage) => setPage(newPage)}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10))
                        setPage(0)
                      }}
                      labelRowsPerPage="Agregações por página"
                      labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
                      }
                      sx={{
                        '& .MuiTablePagination-toolbar': { fontSize: 12 },
                        '& .MuiTablePagination-selectLabel': { fontSize: 12, color: '#e65100', fontWeight: 700 },
                        '& .MuiTablePagination-displayedRows': { fontSize: 12 },
                      }}
                    />
                  </TableRow>
                </TableFooter>
              </Table>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  )
}

export { AgregadorPage }




