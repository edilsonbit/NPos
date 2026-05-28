import { createDataLayer } from '../data/repositories'
import type { ActivityLog, Coupon } from '../domain/models'
import { normalizeText } from '../utils/textNormalization'

const dataLayer = createDataLayer()
const MAX_EVIDENCE_ITEMS = 10
const MAX_LOG_SUMMARY_RECORDS = 10
const ASSISTANT_API_TIMEOUT_MS = 10000
const ASSISTANT_API_URL = import.meta.env.VITE_ASSISTANT_API_URL?.trim() || '/api/assistant/query'

export type EmbeddedAiUserProfile = 'operador' | 'analista' | 'administrador'
export type EmbeddedAiQueryType =
  | 'cancelados_por_data'
  | 'status_agrupamento_cupom'
  | 'metricas_operacionais'
  | 'resumo_logs'
  | 'desconhecida'

export type EmbeddedAiResponseStatus = 'ok' | 'insufficient_context' | 'forbidden' | 'error'

interface EmbeddedAiEvidence {
  source: 'coupons' | 'activityLogs'
  recordId: string
  snippet: string
}

export interface EmbeddedAiResponse {
  requestId: string
  generatedAt: string
  queryType: EmbeddedAiQueryType
  status: EmbeddedAiResponseStatus
  answer: string
  evidence: EmbeddedAiEvidence[]
  warnings: string[]
  profile: EmbeddedAiUserProfile
  metadata?: {
    model: string
    latencyMs: number
    retrievedCount: number
    confidence: 'low' | 'medium' | 'high'
  }
}

export interface EmbeddedAiMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface EmbeddedAiRequest {
  prompt: string
  userEmail?: string
  conversation?: EmbeddedAiMessage[]
}

const isEmbeddedAiResponse = (value: unknown): value is EmbeddedAiResponse => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<EmbeddedAiResponse>
  return (
    typeof candidate.requestId === 'string' &&
    typeof candidate.generatedAt === 'string' &&
    typeof candidate.queryType === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.answer === 'string' &&
    Array.isArray(candidate.evidence) &&
    Array.isArray(candidate.warnings) &&
    typeof candidate.profile === 'string'
  )
}

const askAssistantViaApi = async ({ prompt, userEmail, conversation }: EmbeddedAiRequest): Promise<EmbeddedAiResponse | null> => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), ASSISTANT_API_TIMEOUT_MS)

  try {
    const response = await fetch(ASSISTANT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userEmail, conversation }),
      signal: controller.signal,
    })

    if (!response.ok) return null

    const payload = (await response.json()) as unknown
    return isEmbeddedAiResponse(payload) ? payload : null
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

const parseEmails = (raw: string | undefined): Set<string> => {
  if (!raw) return new Set()
  return new Set(
    raw
      .split(',')
      .map((email) => normalizeText(email))
      .filter(Boolean),
  )
}

const adminEmails = parseEmails(import.meta.env.VITE_AI_ADMIN_EMAILS)
const analystEmails = parseEmails(import.meta.env.VITE_AI_ANALYST_EMAILS)

const resolveProfile = (userEmail?: string): EmbeddedAiUserProfile => {
  const normalized = normalizeText(userEmail)
  if (normalized && adminEmails.has(normalized)) return 'administrador'
  if (normalized && analystEmails.has(normalized)) return 'analista'
  return 'operador'
}

const hasLogAccess = (profile: EmbeddedAiUserProfile) =>
  profile === 'administrador' || profile === 'analista'

const newResponse = (
  profile: EmbeddedAiUserProfile,
  queryType: EmbeddedAiQueryType,
  status: EmbeddedAiResponseStatus,
  answer: string,
  evidence: EmbeddedAiEvidence[] = [],
  warnings: string[] = [],
): EmbeddedAiResponse => ({
  requestId: `IA-${Date.now()}`,
  generatedAt: new Date().toISOString(),
  queryType,
  status,
  answer,
  evidence,
  warnings,
  profile,
})

const parseDateInput = (prompt: string): string | null => {
  const dateMatch = prompt.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/)
  if (!dateMatch) return null
  const [, ddRaw, mmRaw, yyRaw] = dateMatch
  const dd = ddRaw.padStart(2, '0')
  const mm = mmRaw.padStart(2, '0')
  const yyyy = yyRaw.length === 2 ? `20${yyRaw}` : yyRaw
  return `${yyyy}-${mm}-${dd}`
}

const toDayKey = (value: Date) => value.toISOString().slice(0, 10)

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const hasAny = (text: string, terms: string[]) => terms.some((term) => text.includes(term))

const filterCouponsByPeriod = (coupons: Coupon[], normalizedPrompt: string) => {
  const explicitDate = parseDateInput(normalizedPrompt)
  if (explicitDate) {
    return {
      filtered: coupons.filter((coupon) => coupon.createdAt.slice(0, 10) === explicitDate),
      label: `em ${explicitDate}`,
    }
  }

  const now = new Date()
  const todayKey = toDayKey(now)

  if (normalizedPrompt.includes('hoje')) {
    return {
      filtered: coupons.filter((coupon) => coupon.createdAt.slice(0, 10) === todayKey),
      label: 'hoje',
    }
  }

  if (normalizedPrompt.includes('ontem')) {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = toDayKey(yesterday)
    return {
      filtered: coupons.filter((coupon) => coupon.createdAt.slice(0, 10) === yesterdayKey),
      label: 'ontem',
    }
  }

  if (
    /ultim[oa]s?\s+7\s+dias/.test(normalizedPrompt) ||
    normalizedPrompt.includes('ultima semana')
  ) {
    const minDate = new Date(now)
    minDate.setDate(minDate.getDate() - 7)
    return {
      filtered: coupons.filter((coupon) => {
        const createdAt = new Date(coupon.createdAt)
        return createdAt >= minDate && createdAt <= now
      }),
      label: 'nos ultimos 7 dias',
    }
  }

  if (normalizedPrompt.includes('este mes') || normalizedPrompt.includes('mes atual')) {
    const year = now.getFullYear()
    const month = now.getMonth()
    return {
      filtered: coupons.filter((coupon) => {
        const createdAt = new Date(coupon.createdAt)
        return createdAt.getFullYear() === year && createdAt.getMonth() === month
      }),
      label: 'no mes atual',
    }
  }

  return { filtered: coupons, label: 'na base atual' }
}

const countBy = (coupons: Coupon[], getter: (coupon: Coupon) => string) => {
  return coupons.reduce((acc, coupon) => {
    const key = getter(coupon).trim() || 'Nao informado'
    acc.set(key, (acc.get(key) ?? 0) + 1)
    return acc
  }, new Map<string, number>())
}

const sumBy = (coupons: Coupon[], getter: (coupon: Coupon) => string) => {
  return coupons.reduce((acc, coupon) => {
    const key = getter(coupon).trim() || 'Nao informado'
    acc.set(key, (acc.get(key) ?? 0) + coupon.amount)
    return acc
  }, new Map<string, number>())
}

const topEntry = (map: Map<string, number>) => {
  const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  return {
    top: entries[0],
    entries,
  }
}

const buildCouponEvidence = (coupons: Coupon[], sourceLabel: string): EmbeddedAiEvidence[] => {
  return coupons.slice(0, MAX_EVIDENCE_ITEMS).map((coupon) => ({
    source: 'coupons' as const,
    recordId: coupon.id,
    snippet: `${sourceLabel} | cupom ${coupon.couponNumber} | loja ${coupon.storeId} | ${coupon.status} | ${coupon.createdAt.slice(0, 10)} | valor ${formatCurrency(coupon.amount)}.`,
  }))
}

const resolveOperationalMetricsQuery = (
  profile: EmbeddedAiUserProfile,
  coupons: Coupon[],
  normalizedPrompt: string,
): EmbeddedAiResponse | null => {
  const { filtered, label } = filterCouponsByPeriod(coupons, normalizedPrompt)

  if (filtered.length === 0) {
    return newResponse(
      profile,
      'metricas_operacionais',
      'insufficient_context',
      `Nao encontrei cupons ${label}.`,
      [],
      ['Tente remover ou ajustar o periodo informado.'],
    )
  }

  const asksMostStoreByCoupons =
    normalizedPrompt.includes('loja') &&
    hasAny(normalizedPrompt, ['mais', 'maior', 'top']) &&
    hasAny(normalizedPrompt, ['cupom', 'cupon'])

  if (asksMostStoreByCoupons) {
    const ranking = topEntry(countBy(filtered, (coupon) => coupon.storeId))
    if (!ranking.top) return null
    const [storeId, count] = ranking.top
    const evidence = buildCouponEvidence(
      filtered.filter((coupon) => coupon.storeId === storeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      'Ranking por loja',
    )

    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `A loja com mais cupons ${label} e ${storeId}, com ${count} ${pluralize(count, 'cupom', 'cupons')}.`,
      evidence,
      ranking.entries.length > 1
        ? [`Segundo lugar: ${ranking.entries[1][0]} com ${ranking.entries[1][1]} cupons.`]
        : [],
    )
  }

  const asksMostExpensiveCoupon =
    hasAny(normalizedPrompt, ['cupom', 'cupon']) &&
    (normalizedPrompt.includes('mais caro') ||
      normalizedPrompt.includes('maior valor') ||
      normalizedPrompt.includes('valor mais alto') ||
      normalizedPrompt.includes('ticket mais alto'))

  if (asksMostExpensiveCoupon) {
    const sortedByAmount = [...filtered].sort((a, b) => b.amount - a.amount)
    const topCoupon = sortedByAmount[0]
    if (!topCoupon) return null

    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `O cupom mais caro ${label} e o ${topCoupon.couponNumber}, no valor de ${formatCurrency(topCoupon.amount)} (loja ${topCoupon.storeId}, status ${topCoupon.status}, data ${topCoupon.createdAt.slice(0, 10)}).`,
      buildCouponEvidence(sortedByAmount, 'Cupons de maior valor'),
      sortedByAmount.length > 1
        ? [`Segundo maior valor: cupom ${sortedByAmount[1].couponNumber} com ${formatCurrency(sortedByAmount[1].amount)}.`]
        : [],
    )
  }

  const asksTotalCoupons =
    hasAny(normalizedPrompt, ['quant', 'total']) && hasAny(normalizedPrompt, ['cupom', 'cupon'])

  if (asksTotalCoupons) {
    const cancelled = filtered.filter((coupon) => coupon.status === 'cancelado').length
    const authorized = filtered.length - cancelled
    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `Existem ${filtered.length} ${pluralize(filtered.length, 'cupom', 'cupons')} ${label}: ${authorized} autorizados e ${cancelled} cancelados.`,
      buildCouponEvidence(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 'Resumo de quantidade'),
    )
  }

  const asksRevenue = hasAny(normalizedPrompt, ['faturament', 'receita', 'valor total'])
  if (asksRevenue) {
    const total = filtered.reduce((acc, coupon) => acc + coupon.amount, 0)
    const cancelledTotal = filtered
      .filter((coupon) => coupon.status === 'cancelado')
      .reduce((acc, coupon) => acc + coupon.amount, 0)
    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `O valor total ${label} e ${formatCurrency(total)}. Desse total, ${formatCurrency(cancelledTotal)} sao de cupons cancelados.`,
      buildCouponEvidence(filtered.sort((a, b) => b.amount - a.amount), 'Resumo de faturamento'),
    )
  }

  const asksAverageTicket = normalizedPrompt.includes('ticket') && normalizedPrompt.includes('medi')
  if (asksAverageTicket) {
    const authorized = filtered.filter((coupon) => coupon.status === 'autorizado')
    const totalAuthorized = authorized.reduce((acc, coupon) => acc + coupon.amount, 0)
    const avg = authorized.length ? totalAuthorized / authorized.length : 0
    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `O ticket medio ${label} e ${formatCurrency(avg)}, considerando ${authorized.length} ${pluralize(authorized.length, 'cupom autorizado', 'cupons autorizados')}.`,
      buildCouponEvidence(authorized.sort((a, b) => b.amount - a.amount), 'Ticket medio'),
      authorized.length === 0 ? ['Nao ha cupons autorizados no filtro informado.'] : [],
    )
  }

  const asksTopAcquirer =
    normalizedPrompt.includes('adquirente') && hasAny(normalizedPrompt, ['mais', 'maior', 'top'])
  if (asksTopAcquirer) {
    const ranking = topEntry(countBy(filtered, (coupon) => coupon.acquirer))
    if (!ranking.top) return null
    const [acquirer, count] = ranking.top
    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `O adquirente com mais cupons ${label} e ${acquirer}, com ${count} registros.`,
      buildCouponEvidence(
        filtered.filter((coupon) => coupon.acquirer === acquirer).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        'Ranking por adquirente',
      ),
    )
  }

  const asksTopPaymentMethod =
    hasAny(normalizedPrompt, ['pagamento', 'meio']) && hasAny(normalizedPrompt, ['mais', 'maior', 'top'])
  if (asksTopPaymentMethod) {
    const ranking = topEntry(countBy(filtered, (coupon) => coupon.paymentMethod))
    if (!ranking.top) return null
    const [paymentMethod, count] = ranking.top
    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `O meio de pagamento com maior volume ${label} e ${paymentMethod}, com ${count} cupons.`,
      buildCouponEvidence(
        filtered.filter((coupon) => coupon.paymentMethod === paymentMethod).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        'Ranking por meio de pagamento',
      ),
    )
  }

  const asksCancelRate =
    normalizedPrompt.includes('cancel') && hasAny(normalizedPrompt, ['taxa', 'percent', 'percentual'])
  if (asksCancelRate) {
    const cancelled = filtered.filter((coupon) => coupon.status === 'cancelado').length
    const rate = filtered.length ? (cancelled / filtered.length) * 100 : 0
    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `A taxa de cancelamento ${label} e ${rate.toFixed(2)}% (${cancelled} de ${filtered.length} cupons).`,
      buildCouponEvidence(
        filtered.filter((coupon) => coupon.status === 'cancelado').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        'Taxa de cancelamento',
      ),
    )
  }

  const asksGroupedTotal = hasAny(normalizedPrompt, ['agrupad', 'agregad']) && hasAny(normalizedPrompt, ['quant', 'total'])
  if (asksGroupedTotal) {
    const groupedCoupons = filtered.filter((coupon) => Boolean(coupon.idAgregador))
    const aggregationIds = new Set(groupedCoupons.map((coupon) => coupon.idAgregador).filter(Boolean))
    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `Existem ${groupedCoupons.length} ${pluralize(groupedCoupons.length, 'cupom agrupado', 'cupons agrupados')} ${label}, distribuidos em ${aggregationIds.size} ${pluralize(aggregationIds.size, 'grupo', 'grupos')}.`,
      buildCouponEvidence(groupedCoupons.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 'Resumo de agrupamento'),
    )
  }

  const asksStoreRevenue =
    normalizedPrompt.includes('loja') &&
    hasAny(normalizedPrompt, ['mais', 'maior', 'top']) &&
    hasAny(normalizedPrompt, ['faturament', 'receita', 'valor'])
  if (asksStoreRevenue) {
    const ranking = topEntry(sumBy(filtered, (coupon) => coupon.storeId))
    if (!ranking.top) return null
    const [storeId, value] = ranking.top
    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `A loja com maior faturamento ${label} e ${storeId}, com ${formatCurrency(value)}.`,
      buildCouponEvidence(
        filtered.filter((coupon) => coupon.storeId === storeId).sort((a, b) => b.amount - a.amount),
        'Ranking de faturamento por loja',
      ),
    )
  }

  return null
}

const findCancelledByDate = (coupons: Coupon[], prompt: string) => {
  const dateKey = parseDateInput(prompt)
  if (!dateKey) return null

  const matches = coupons.filter(
    (coupon) => coupon.status === 'cancelado' && coupon.createdAt.slice(0, 10) === dateKey,
  )

  return { dateKey, matches }
}

const findAllCancelled = (coupons: Coupon[]) => {
  return coupons
    .filter((coupon) => coupon.status === 'cancelado')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const extractCouponNumber = (prompt: string): string | null => {
  const exact = prompt.match(/\bcupom\s+([a-z0-9-]+)\b/i)
  if (exact?.[1]) return exact[1]
  const fallback = prompt.match(/\b(\d{4,})\b/)
  return fallback?.[1] ?? null
}

const findCouponAggregationStatus = (coupons: Coupon[], prompt: string) => {
  const couponNumber = extractCouponNumber(prompt)
  if (!couponNumber) return null
  const normalizedNumber = normalizeText(couponNumber)
  const matches = coupons.filter((coupon) => normalizeText(coupon.couponNumber) === normalizedNumber)
  return { couponNumber, matches }
}

const summarizeRecentLogs = (logs: ActivityLog[]) => {
  const recentLogs = logs.slice(0, MAX_LOG_SUMMARY_RECORDS)
  const success = recentLogs.filter((item) => item.status === 'sucesso').length
  const errors = recentLogs.filter((item) => item.status === 'erro').length
  const topActions = Array.from(
    recentLogs.reduce((acc, log) => {
      acc.set(log.action, (acc.get(log.action) ?? 0) + 1)
      return acc
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([action, count]) => `${action}: ${count}`)

  return { recentLogs, success, errors, topActions }
}

const pluralize = (count: number, singular: string, plural: string) =>
  count === 1 ? singular : plural

export const askEmbeddedAssistant = async ({
  prompt,
  userEmail,
}: EmbeddedAiRequest): Promise<EmbeddedAiResponse> => {
  const apiResponse = await askAssistantViaApi({ prompt, userEmail })
  if (apiResponse) {
    return apiResponse
  }

  const profile = resolveProfile(userEmail)
  const normalizedPrompt = normalizeText(prompt)

  if (!normalizedPrompt) {
    return newResponse(
      profile,
      'desconhecida',
      'insufficient_context',
      'Informe uma pergunta com contexto operacional (ex.: cancelados por data ou status de cupom).',
    )
  }

  try {
    const [coupons, activityLogs] = await Promise.all([
      dataLayer.coupons.list(),
      dataLayer.activityLogs.list(200),
    ])

    const metricsResponse = resolveOperationalMetricsQuery(profile, coupons, normalizedPrompt)
    if (metricsResponse) {
      return metricsResponse
    }

    if (normalizedPrompt.includes('cancelad')) {
      const payload = findCancelledByDate(coupons, normalizedPrompt)
      if (!payload?.dateKey) {
        const cancelledCoupons = findAllCancelled(coupons)
        const evidence = cancelledCoupons.slice(0, MAX_EVIDENCE_ITEMS).map((coupon) => ({
          source: 'coupons' as const,
          recordId: coupon.id,
          snippet: `Cupom ${coupon.couponNumber} cancelado em ${coupon.createdAt.slice(0, 10)} (loja ${coupon.storeId}).`,
        }))

        return newResponse(
          profile,
          'cancelados_por_data',
          'ok',
          cancelledCoupons.length > 0
            ? `Encontrei ${cancelledCoupons.length} ${pluralize(cancelledCoupons.length, 'cupom', 'cupons')} cancelados no total. Posso detalhar por data se voce informar um dia especifico (DD/MM/AA ou DD/MM/AAAA).`
            : 'Nao encontrei cupons cancelados na base atual.',
          evidence,
          ['Pergunta sem data especifica: resposta retornada em modo resumo geral.'],
        )
      }

      const evidence = payload.matches.slice(0, MAX_EVIDENCE_ITEMS).map((coupon) => ({
        source: 'coupons' as const,
        recordId: coupon.id,
        snippet: `Cupom ${coupon.couponNumber} cancelado em ${coupon.createdAt.slice(0, 10)} (loja ${coupon.storeId}).`,
      }))

      return newResponse(
        profile,
        'cancelados_por_data',
        'ok',
        payload.matches.length > 0
          ? `Foram encontrados ${payload.matches.length} ${pluralize(payload.matches.length, 'cupom', 'cupons')} cancelados em ${payload.dateKey}.`
          : `Não encontrei cupons cancelados em ${payload.dateKey}.`,
        evidence,
        payload.matches.length === 0
          ? ['Sem resultados para a data informada. Verifique o período ou a base de dados.']
          : [],
      )
    }

    if (
      normalizedPrompt.includes('cupom') &&
      (normalizedPrompt.includes('agrupad') || normalizedPrompt.includes('agregad'))
    ) {
      const payload = findCouponAggregationStatus(coupons, normalizedPrompt)
      if (!payload?.couponNumber) {
        return newResponse(
          profile,
          'status_agrupamento_cupom',
          'insufficient_context',
          'Não consegui identificar o número do cupom na pergunta.',
        )
      }

      if (payload.matches.length === 0) {
        return newResponse(
          profile,
          'status_agrupamento_cupom',
          'insufficient_context',
          `Não encontrei registros para o cupom ${payload.couponNumber}.`,
        )
      }

      const grouped = payload.matches.some((coupon) => Boolean(coupon.idAgregador))
      const aggregatorIds = Array.from(
        new Set(payload.matches.map((coupon) => coupon.idAgregador).filter(Boolean)),
      )

      const evidence = payload.matches.slice(0, MAX_EVIDENCE_ITEMS).map((coupon) => ({
        source: 'coupons' as const,
        recordId: coupon.id,
        snippet: `Cupom ${coupon.couponNumber} | situação: ${coupon.situacao ?? 'sem situação'} | agregador: ${coupon.idAgregador ?? 'não agregado'}.`,
      }))

      return newResponse(
        profile,
        'status_agrupamento_cupom',
        'ok',
        grouped
          ? `O cupom ${payload.couponNumber} está agrupado (${aggregatorIds.join(', ')}).`
          : `O cupom ${payload.couponNumber} não está agrupado no momento.`,
        evidence,
      )
    }

    if (
      normalizedPrompt.includes('log') ||
      normalizedPrompt.includes('auditoria') ||
      normalizedPrompt.includes('alerta')
    ) {
      if (!hasLogAccess(profile)) {
        return newResponse(
          profile,
          'resumo_logs',
          'forbidden',
          'Seu perfil não possui acesso a consultas de logs de auditoria.',
          [],
          ['Solicite um perfil analista ou administrador para esse tipo de consulta.'],
        )
      }

      const summary = summarizeRecentLogs(activityLogs)
      const evidence = summary.recentLogs.slice(0, MAX_EVIDENCE_ITEMS).map((log) => ({
        source: 'activityLogs' as const,
        recordId: log.id ?? log.timestamp,
        snippet: `${log.action} | ${log.status} | ${log.description}`,
      }))

      return newResponse(
        profile,
        'resumo_logs',
        'ok',
        `Últimos ${summary.recentLogs.length} ${pluralize(summary.recentLogs.length, 'log', 'logs')}: ${summary.success} ${pluralize(summary.success, 'sucesso', 'sucessos')}, ${summary.errors} ${pluralize(summary.errors, 'erro', 'erros')}. Ações mais frequentes: ${summary.topActions.join(' | ') || 'sem dados'}.`,
        evidence,
      )
    }

    return newResponse(
      profile,
      'desconhecida',
      'insufficient_context',
      'Não consegui classificar sua consulta. Tente exemplos como: "quais cupons foram cancelados em 21/05/26?" ou "o cupom 123456 está agrupado?".',
    )
  } catch (err) {
    return newResponse(
      profile,
      'desconhecida',
      'error',
      'Falha ao consultar dados internos do assistente IA.',
      [],
      [String(err)],
    )
  }
}
