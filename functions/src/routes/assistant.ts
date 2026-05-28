import { Router } from 'express'
import type { Firestore } from 'firebase-admin/firestore'
import type { Coupon } from '../domain/models.js'

interface ActivityLog {
  id?: string
  timestamp: string
  action: string
  description: string
  status: 'sucesso' | 'erro'
}

type EmbeddedAiUserProfile = 'operador' | 'analista' | 'administrador'
type EmbeddedAiQueryType =
  | 'cancelados_por_data'
  | 'status_agrupamento_cupom'
  | 'metricas_operacionais'
  | 'resumo_logs'
  | 'desconhecida'
type EmbeddedAiResponseStatus = 'ok' | 'insufficient_context' | 'forbidden' | 'error'

type EmbeddedAiEvidence = {
  source: 'coupons' | 'activityLogs'
  recordId: string
  snippet: string
}

type EmbeddedAiResponse = {
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

type AssistantAuditRecord = {
  requestId: string
  generatedAt: string
  userEmail?: string
  prompt: string
  queryType: EmbeddedAiQueryType
  status: EmbeddedAiResponseStatus
  profile: EmbeddedAiUserProfile
  latencyMs: number
  retrievedCount: number
  evidence: Array<{ source: string; recordId: string }>
  usedLlm: boolean
  model: string
  warnings: string[]
}

type AssistantRequestBody = {
  prompt?: string
  userEmail?: string
}

const MAX_EVIDENCE_ITEMS = 10
const MAX_LOG_SUMMARY_RECORDS = 10
const ASSISTANT_FALLBACK_MODEL = 'rule-engine-local'

const normalizeText = (value: string | undefined | null) => {
  if (!value) return ''

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR')
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

const adminEmails = parseEmails(process.env.ASSISTANT_ADMIN_EMAILS ?? process.env.VITE_AI_ADMIN_EMAILS)
const analystEmails = parseEmails(process.env.ASSISTANT_ANALYST_EMAILS ?? process.env.VITE_AI_ANALYST_EMAILS)

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

const pluralize = (count: number, singular: string, plural: string) =>
  count === 1 ? singular : plural

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

const tryHumanizeAnswerWithLlm = async (
  prompt: string,
  response: EmbeddedAiResponse,
): Promise<string | null> => {
  if (process.env.ASSISTANT_LLM_ENABLED !== 'true') return null

  const endpoint = process.env.ASSISTANT_LLM_ENDPOINT
  const apiKey = process.env.ASSISTANT_LLM_API_KEY
  const model = process.env.ASSISTANT_LLM_MODEL ?? 'gpt-4.1-mini'

  if (!endpoint || !apiKey) return null

  try {
    const llmResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'Reescreva respostas operacionais em portugues do Brasil com tom claro e objetivo. Nao invente dados, nao altere numeros e preserve os fatos/evidencias.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              prompt,
              answer: response.answer,
              warnings: response.warnings,
              evidence: response.evidence.slice(0, 5),
            }),
          },
        ],
      }),
    })

    if (!llmResponse.ok) return null

    const payload = (await llmResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const content = payload.choices?.[0]?.message?.content?.trim()
    return content || null
  } catch {
    return null
  }
}

const inferConfidence = (response: EmbeddedAiResponse): 'low' | 'medium' | 'high' => {
  if (response.status !== 'ok') return 'low'
  if (response.evidence.length >= 5) return 'high'
  if (response.evidence.length >= 2) return 'medium'
  return 'low'
}

const enrichResponseMetadata = (response: EmbeddedAiResponse, latencyMs: number): EmbeddedAiResponse => {
  const llmWarning = response.warnings.find((warning) => warning.includes('LLM externo'))
  const model = llmWarning
    ? process.env.ASSISTANT_LLM_MODEL ?? 'external-llm'
    : ASSISTANT_FALLBACK_MODEL

  return {
    ...response,
    metadata: {
      model,
      latencyMs,
      retrievedCount: response.evidence.length,
      confidence: inferConfidence(response),
    },
  }
}

const toAuditRecord = (
  prompt: string,
  userEmail: string | undefined,
  response: EmbeddedAiResponse,
): AssistantAuditRecord => {
  const metadata = response.metadata ?? {
    model: ASSISTANT_FALLBACK_MODEL,
    latencyMs: 0,
    retrievedCount: response.evidence.length,
    confidence: inferConfidence(response),
  }

  return {
    requestId: response.requestId,
    generatedAt: response.generatedAt,
    userEmail,
    prompt,
    queryType: response.queryType,
    status: response.status,
    profile: response.profile,
    latencyMs: metadata.latencyMs,
    retrievedCount: metadata.retrievedCount,
    evidence: response.evidence.map((item) => ({ source: item.source, recordId: item.recordId })),
    usedLlm: metadata.model !== ASSISTANT_FALLBACK_MODEL,
    model: metadata.model,
    warnings: response.warnings,
  }
}

const resolveAssistantResponse = async (
  prompt: string,
  userEmail: string | undefined,
  coupons: Coupon[],
  activityLogs: ActivityLog[],
): Promise<EmbeddedAiResponse> => {
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

  let response: EmbeddedAiResponse = newResponse(
    profile,
    'desconhecida',
    'insufficient_context',
    'Nao consegui classificar sua consulta. Tente exemplos como: "quais cupons foram cancelados em 21/05/26?" ou "o cupom 123456 esta agrupado?".',
  )

  const metricsResponse = resolveOperationalMetricsQuery(profile, coupons, normalizedPrompt)
  if (metricsResponse) {
    response = metricsResponse
  } else if (normalizedPrompt.includes('cancelad')) {
    const payload = findCancelledByDate(coupons, normalizedPrompt)
    if (!payload?.dateKey) {
      const cancelledCoupons = findAllCancelled(coupons)
      const evidence = cancelledCoupons.slice(0, MAX_EVIDENCE_ITEMS).map((coupon) => ({
        source: 'coupons' as const,
        recordId: coupon.id,
        snippet: `Cupom ${coupon.couponNumber} cancelado em ${coupon.createdAt.slice(0, 10)} (loja ${coupon.storeId}).`,
      }))

      response = newResponse(
        profile,
        'cancelados_por_data',
        'ok',
        cancelledCoupons.length > 0
          ? `Encontrei ${cancelledCoupons.length} ${pluralize(cancelledCoupons.length, 'cupom', 'cupons')} cancelados no total. Posso detalhar por data se voce informar um dia especifico (DD/MM/AA ou DD/MM/AAAA).`
          : 'Nao encontrei cupons cancelados na base atual.',
        evidence,
        ['Pergunta sem data especifica: resposta retornada em modo resumo geral.'],
      )
    } else {
      const evidence = payload.matches.slice(0, MAX_EVIDENCE_ITEMS).map((coupon) => ({
        source: 'coupons' as const,
        recordId: coupon.id,
        snippet: `Cupom ${coupon.couponNumber} cancelado em ${coupon.createdAt.slice(0, 10)} (loja ${coupon.storeId}).`,
      }))

      response = newResponse(
        profile,
        'cancelados_por_data',
        'ok',
        payload.matches.length > 0
          ? `Foram encontrados ${payload.matches.length} ${pluralize(payload.matches.length, 'cupom', 'cupons')} cancelados em ${payload.dateKey}.`
          : `Nao encontrei cupons cancelados em ${payload.dateKey}.`,
        evidence,
        payload.matches.length === 0
          ? ['Sem resultados para a data informada. Verifique o periodo ou a base de dados.']
          : [],
      )
    }
  } else if (
    normalizedPrompt.includes('cupom') &&
    (normalizedPrompt.includes('agrupad') || normalizedPrompt.includes('agregad'))
  ) {
    const payload = findCouponAggregationStatus(coupons, normalizedPrompt)
    if (!payload?.couponNumber) {
      response = newResponse(
        profile,
        'status_agrupamento_cupom',
        'insufficient_context',
        'Nao consegui identificar o numero do cupom na pergunta.',
      )
    } else if (payload.matches.length === 0) {
      response = newResponse(
        profile,
        'status_agrupamento_cupom',
        'insufficient_context',
        `Nao encontrei registros para o cupom ${payload.couponNumber}.`,
      )
    } else {
      const grouped = payload.matches.some((coupon) => Boolean(coupon.idAgregador))
      const aggregatorIds = Array.from(
        new Set(payload.matches.map((coupon) => coupon.idAgregador).filter(Boolean)),
      )

      const evidence = payload.matches.slice(0, MAX_EVIDENCE_ITEMS).map((coupon) => ({
        source: 'coupons' as const,
        recordId: coupon.id,
        snippet: `Cupom ${coupon.couponNumber} | situacao: sem situacao | agregador: ${coupon.idAgregador ?? 'nao agregado'}.`,
      }))

      response = newResponse(
        profile,
        'status_agrupamento_cupom',
        'ok',
        grouped
          ? `O cupom ${payload.couponNumber} esta agrupado (${aggregatorIds.join(', ')}).`
          : `O cupom ${payload.couponNumber} nao esta agrupado no momento.`,
        evidence,
      )
    }
  } else if (
    normalizedPrompt.includes('log') ||
    normalizedPrompt.includes('auditoria') ||
    normalizedPrompt.includes('alerta')
  ) {
    if (!hasLogAccess(profile)) {
      response = newResponse(
        profile,
        'resumo_logs',
        'forbidden',
        'Seu perfil nao possui acesso a consultas de logs de auditoria.',
        [],
        ['Solicite um perfil analista ou administrador para esse tipo de consulta.'],
      )
    } else {
      const summary = summarizeRecentLogs(activityLogs)
      const evidence = summary.recentLogs.slice(0, MAX_EVIDENCE_ITEMS).map((log) => ({
        source: 'activityLogs' as const,
        recordId: log.id ?? log.timestamp,
        snippet: `${log.action} | ${log.status} | ${log.description}`,
      }))

      response = newResponse(
        profile,
        'resumo_logs',
        'ok',
        `Ultimos ${summary.recentLogs.length} ${pluralize(summary.recentLogs.length, 'log', 'logs')}: ${summary.success} ${pluralize(summary.success, 'sucesso', 'sucessos')}, ${summary.errors} ${pluralize(summary.errors, 'erro', 'erros')}. Acoes mais frequentes: ${summary.topActions.join(' | ') || 'sem dados'}.`,
        evidence,
      )
    }
  }

  const rewritten = await tryHumanizeAnswerWithLlm(prompt, response)
  if (!rewritten) return response

  return {
    ...response,
    answer: rewritten,
    warnings: ['Resposta redigida com apoio de LLM externo usando apenas contexto interno.', ...response.warnings],
  }
}

export const createAssistantRouter = (db: Firestore): Router => {
  const router = Router()

  router.get('/health', (_req, res) => {
    const llmEnabled = process.env.ASSISTANT_LLM_ENABLED === 'true'
    const llmConfigured = Boolean(process.env.ASSISTANT_LLM_ENDPOINT && process.env.ASSISTANT_LLM_API_KEY)

    res.status(200).json({
      status: 'ok',
      service: 'assistant',
      llmEnabled,
      llmConfigured,
      fallbackModel: ASSISTANT_FALLBACK_MODEL,
      region: process.env.FUNCTION_REGION ?? 'southamerica-east1',
      generatedAt: new Date().toISOString(),
    })
  })

  router.post('/query', async (req, res) => {
    const startedAt = Date.now()
    const body = (req.body ?? {}) as AssistantRequestBody
    const prompt = String(body.prompt ?? '').trim()

    if (!prompt) {
      res.status(400).json({ error: 'Body invalido. Envie { prompt: string, userEmail?: string }.' })
      return
    }

    try {
      const [couponSnapshot, logSnapshot] = await Promise.all([
        db.collection('coupons').get(),
        db.collection('activityLogs').orderBy('timestamp', 'desc').limit(200).get(),
      ])

      const coupons = couponSnapshot.docs.map((doc) => doc.data() as Coupon)
      const logs = logSnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ActivityLog) }))

      const rawResponse = await resolveAssistantResponse(prompt, body.userEmail, coupons, logs)
      const response = enrichResponseMetadata(rawResponse, Date.now() - startedAt)

      try {
        await db.collection('assistantLogs').add(toAuditRecord(prompt, body.userEmail, response))
      } catch (auditError) {
        console.error('Falha ao gravar auditoria assistantLogs', auditError)
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('Erro em POST /assistant/query', error)
      const errorResponse: EmbeddedAiResponse = {
        requestId: `IA-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        queryType: 'desconhecida',
        status: 'error',
        answer: 'Falha ao consultar dados internos do assistente IA.',
        evidence: [],
        warnings: [error instanceof Error ? error.message : 'Erro desconhecido'],
        profile: 'operador',
        metadata: {
          model: ASSISTANT_FALLBACK_MODEL,
          latencyMs: Date.now() - startedAt,
          retrievedCount: 0,
          confidence: 'low',
        },
      }

      try {
        await db.collection('assistantLogs').add(toAuditRecord(prompt, body.userEmail, errorResponse))
      } catch (auditError) {
        console.error('Falha ao gravar auditoria de erro assistantLogs', auditError)
      }

      res.status(500).json(errorResponse)
    }
  })

  return router
}
