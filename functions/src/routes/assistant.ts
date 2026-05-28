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

type AssistantConversationMessage = {
  role: 'user' | 'assistant'
  content: string
}

type AssistantRequestBody = {
  prompt?: string
  userEmail?: string
  conversation?: AssistantConversationMessage[]
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

type AssistantQueryIntent =
  | 'top_product'
  | 'top_store'
  | 'top_payment_method'
  | 'top_acquirer'
  | 'most_expensive_product'
  | 'most_expensive_coupon'
  | 'product_revenue'
  | 'total_coupons'
  | 'total_revenue'
  | 'avg_ticket'
  | 'cancel_rate'
  | 'cancelled_by_date'
  | 'coupon_status'
  | 'grouped_total'
  | 'unknown'

interface AssistantQuerySpec {
  intent: AssistantQueryIntent
  entity?: 'product' | 'store' | 'coupon' | 'paymentMethod' | 'acquirer' | 'general'
  productName?: string
  storeId?: string
  couponNumber?: string
  paymentMethod?: string
  acquirer?: string
  period?: 'today' | 'yesterday' | '7days' | 'month' | 'all' | 'specificDate'
  date?: string
}

const buildCouponEvidence = (coupons: Coupon[], sourceLabel: string): EmbeddedAiEvidence[] => {
  return coupons.slice(0, MAX_EVIDENCE_ITEMS).map((coupon) => ({
    source: 'coupons' as const,
    recordId: coupon.id,
    snippet: `${sourceLabel} | cupom ${coupon.couponNumber} | loja ${coupon.storeId} | ${coupon.status} | ${coupon.createdAt.slice(0, 10)} | valor ${formatCurrency(coupon.amount)}.`,
  }))
}

const buildCouponQueryContext = (coupons: Coupon[]) => {
  const total = coupons.length
  const totalRevenue = coupons.reduce((sum, coupon) => sum + coupon.amount, 0)
  const topProductByQty = topEntry(sumByQuantity(coupons, (coupon) => coupon.productName))
  const topProductByRevenue = topEntry(sumBy(coupons, (coupon) => coupon.productName))
  const topProductByUnitPrice = (() => {
    const top = coupons.reduce((best, coupon) => {
      if (!best || coupon.unitPrice > best.unitPrice) {
        return coupon
      }
      return best
    }, undefined as Coupon | undefined)
    return top
  })()
  const topStoreByCoupons = topEntry(countBy(coupons, (coupon) => coupon.storeId))
  const topPaymentMethod = topEntry(countBy(coupons, (coupon) => coupon.paymentMethod))

  return `Dados internos: ${total} cupons, faturamento total ${formatCurrency(totalRevenue)}. Top produto por quantidade: ${topProductByQty.top ? `${topProductByQty.top[0]} (${topProductByQty.top[1]})` : 'sem dados'}. Top produto por receita: ${topProductByRevenue.top ? `${topProductByRevenue.top[0]} (${formatCurrency(topProductByRevenue.top[1])})` : 'sem dados'}. Top produto mais caro: ${topProductByUnitPrice ? `${topProductByUnitPrice.productName} (${formatCurrency(topProductByUnitPrice.unitPrice)})` : 'sem dados'}. Top loja por cupons: ${topStoreByCoupons.top ? `${topStoreByCoupons.top[0]} (${topStoreByCoupons.top[1]})` : 'sem dados'}. Top meio de pagamento: ${topPaymentMethod.top ? `${topPaymentMethod.top[0]} (${topPaymentMethod.top[1]})` : 'sem dados'}.`
}

const buildConversationPrompt = (conversation: AssistantConversationMessage[]) => {
  return conversation
    .map((message) => `${message.role === 'user' ? 'Usuario' : 'Assistente'}: ${message.content}`)
    .join('\n')
}

const parseAssistantQueryWithLlm = async (
  prompt: string,
  coupons: Coupon[],
  conversation: AssistantConversationMessage[] = [],
): Promise<AssistantQuerySpec | null> => {
  if (process.env.ASSISTANT_LLM_ENABLED !== 'true') return null

  const endpoint = process.env.ASSISTANT_LLM_ENDPOINT
  const apiKey = process.env.ASSISTANT_LLM_API_KEY
  const model = process.env.ASSISTANT_LLM_MODEL ?? 'gpt-4.1-mini'

  if (!endpoint || !apiKey) return null

  const context = buildCouponQueryContext(coupons)

  try {
    const conversationContext = conversation.length > 0 ? `Conversa:\n${buildConversationPrompt(conversation)}\n\n` : ''
    const llmResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content:
              'Voce e um parser para consultas de relatorios de cupons e produtos. Responda apenas com JSON valido sem texto adicional. Use os campos: intent, entity, productName, storeId, couponNumber, paymentMethod, acquirer, period, date. period deve ser one of today, yesterday, 7days, month, all, specificDate. date deve estar no formato YYYY-MM-DD se especificado.',
          },
          {
            role: 'user',
            content: `${conversationContext}Pergunta atual: ${prompt}\n\nContexto: ${context}`,
          },
        ],
      }),
    })

    if (!llmResponse.ok) return null

    const payload = (await llmResponse.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const content = payload.choices?.[0]?.message?.content?.trim()
    if (!content) return null

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed: unknown = JSON.parse(jsonMatch[0])
    if (typeof parsed !== 'object' || parsed === null) return null

    const spec = parsed as AssistantQuerySpec
    if (!spec.intent) return null
    return spec
  } catch {
    return null
  }
}

const executeAssistantQuerySpec = (
  profile: EmbeddedAiUserProfile,
  coupons: Coupon[],
  spec: AssistantQuerySpec,
  label: string,
): EmbeddedAiResponse | null => {
  const { filtered } = filterCouponsByPeriod(coupons, spec.period === 'today' ? 'hoje' : spec.period === 'yesterday' ? 'ontem' : spec.period === '7days' ? '7 dias' : spec.period === 'month' ? 'mes atual' : 'na base atual')

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

  switch (spec.intent) {
    case 'top_product': {
      const ranking = topEntry(sumByQuantity(filtered, (coupon) => coupon.productName))
      if (!ranking.top) return null
      const [productName, quantity] = ranking.top
      return newResponse(
        profile,
        'metricas_operacionais',
        'ok',
        `O produto mais vendido ${label} e ${productName}, com ${quantity} unidades vendidas.`,
        buildCouponEvidence(
          filtered.filter((coupon) => coupon.productName === productName).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          'Ranking de produtos por quantidade',
        ),
      )
    }
    case 'most_expensive_product': {
      let topCoupon: Coupon | null = null
      for (const coupon of filtered) {
        if (!topCoupon || coupon.unitPrice > topCoupon.unitPrice) {
          topCoupon = coupon
        }
      }
      if (!topCoupon) return null
      return newResponse(
        profile,
        'metricas_operacionais',
        'ok',
        `O produto mais caro ${label} e ${topCoupon.productName}, com preco unitario de ${formatCurrency(topCoupon.unitPrice)} (cupom ${topCoupon.couponNumber}, loja ${topCoupon.storeId}).`,
        buildCouponEvidence([topCoupon], 'Produto mais caro'),
      )
    }
    case 'product_revenue': {
      const ranking = topEntry(sumBy(filtered, (coupon) => coupon.productName))
      if (!ranking.top) return null
      const [productName, value] = ranking.top
      return newResponse(
        profile,
        'metricas_operacionais',
        'ok',
        `O produto com maior faturamento ${label} e ${productName}, com ${formatCurrency(value)}.`,
        buildCouponEvidence(
          filtered.filter((coupon) => coupon.productName === productName).sort((a, b) => b.amount - a.amount),
          'Ranking de produtos por receita',
        ),
      )
    }
    case 'cancel_rate': {
      const cancelled = filtered.filter((coupon) => coupon.status === 'cancelado').length
      const rate = filtered.length ? (cancelled / filtered.length) * 100 : 0
      return newResponse(
        profile,
        'metricas_operacionais',
        'ok',
        `A taxa de cancelamento ${label} e ${rate.toFixed(2)}% (${cancelled} de ${filtered.length} cupons).`,
        buildCouponEvidence(filtered.filter((coupon) => coupon.status === 'cancelado').sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 'Taxa de cancelamento'),
      )
    }
    case 'total_coupons': {
      const cancelled = filtered.filter((coupon) => coupon.status === 'cancelado').length
      const authorized = filtered.length - cancelled
      return newResponse(
        profile,
        'metricas_operacionais',
        'ok',
        `Existem ${filtered.length} cupons ${label}: ${authorized} autorizados e ${cancelled} cancelados.`,
        buildCouponEvidence(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 'Resumo de quantidade'),
      )
    }
    case 'total_revenue': {
      const total = filtered.reduce((acc, coupon) => acc + coupon.amount, 0)
      const cancelledTotal = filtered.filter((coupon) => coupon.status === 'cancelado').reduce((acc, coupon) => acc + coupon.amount, 0)
      return newResponse(
        profile,
        'metricas_operacionais',
        'ok',
        `O valor total ${label} e ${formatCurrency(total)}. Desse total, ${formatCurrency(cancelledTotal)} sao de cupons cancelados.`,
        buildCouponEvidence(filtered.sort((a, b) => b.amount - a.amount), 'Resumo de faturamento'),
      )
    }
    case 'avg_ticket': {
      const authorized = filtered.filter((coupon) => coupon.status === 'autorizado')
      const totalAuthorized = authorized.reduce((acc, coupon) => acc + coupon.amount, 0)
      const avg = authorized.length ? totalAuthorized / authorized.length : 0
      return newResponse(
        profile,
        'metricas_operacionais',
        'ok',
        `O ticket medio ${label} e ${formatCurrency(avg)}, considerando ${authorized.length} cupons autorizados.`,
        buildCouponEvidence(authorized.sort((a, b) => b.amount - a.amount), 'Ticket medio'),
      )
    }
    case 'top_store': {
      const ranking = topEntry(countBy(filtered, (coupon) => coupon.storeId))
      if (!ranking.top) return null
      const [storeId, count] = ranking.top
      return newResponse(
        profile,
        'metricas_operacionais',
        'ok',
        `A loja com mais cupons ${label} e ${storeId}, com ${count} cupons.`,
        buildCouponEvidence(filtered.filter((coupon) => coupon.storeId === storeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 'Ranking por loja'),
      )
    }
    case 'top_payment_method': {
      const ranking = topEntry(countBy(filtered, (coupon) => coupon.paymentMethod))
      if (!ranking.top) return null
      const [paymentMethod, count] = ranking.top
      return newResponse(
        profile,
        'metricas_operacionais',
        'ok',
        `O meio de pagamento mais usado ${label} e ${paymentMethod}, com ${count} cupons.`,
        buildCouponEvidence(filtered.filter((coupon) => coupon.paymentMethod === paymentMethod).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 'Ranking por meio de pagamento'),
      )
    }
    case 'top_acquirer': {
      const ranking = topEntry(countBy(filtered, (coupon) => coupon.acquirer))
      if (!ranking.top) return null
      const [acquirer, count] = ranking.top
      return newResponse(
        profile,
        'metricas_operacionais',
        'ok',
        `O adquirente com mais cupons ${label} e ${acquirer}, com ${count} registros.`,
        buildCouponEvidence(filtered.filter((coupon) => coupon.acquirer === acquirer).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), 'Ranking por adquirente'),
      )
    }
    default:
      return null
  }
}

const sumByQuantity = (coupons: Coupon[], getter: (coupon: Coupon) => string) => {
  return coupons.reduce((acc, coupon) => {
    const key = getter(coupon).trim() || 'Nao informado'
    acc.set(key, (acc.get(key) ?? 0) + coupon.quantity)
    return acc
  }, new Map<string, number>())
}

const summarizeTopEntries = (entries: Array<[string, number]>, limit = 5) => {
  return entries
    .slice(0, limit)
    .map(([key, value], index) => `${index + 1}. ${key}: ${value}`)
    .join('; ')
}

const isOpenCouponQuestion = (normalizedPrompt: string) => {
  return hasAny(normalizedPrompt, [
    'cupom',
    'cupon',
    'produto',
    'produtos',
    'faturament',
    'receita',
    'ticket',
    'cancel',
    'loja',
    'adquirent',
    'pagament',
    'meio',
    'vend',
    'vendas',
    'quant',
    'percent',
    'taxa',
    'barat',
  ])
}

const buildCouponContextSummary = (coupons: Coupon[]) => {
  const total = coupons.length
  const authorized = coupons.filter((coupon) => coupon.status === 'autorizado').length
  const cancelled = coupons.filter((coupon) => coupon.status === 'cancelado').length
  const totalRevenue = coupons.reduce((acc, coupon) => acc + coupon.amount, 0)
  const avgTicket = authorized
    ? coupons
        .filter((coupon) => coupon.status === 'autorizado')
        .reduce((acc, coupon) => acc + coupon.amount, 0) / authorized
    : 0

  const productByQuantity = topEntry(sumByQuantity(coupons, (coupon) => coupon.productName))
  const productByRevenue = topEntry(sumBy(coupons, (coupon) => coupon.productName))
  const storeByCoupons = topEntry(countBy(coupons, (coupon) => coupon.storeId))
  const storeByRevenue = topEntry(sumBy(coupons, (coupon) => coupon.storeId))
  const paymentMethods = topEntry(countBy(coupons, (coupon) => coupon.paymentMethod))
  const acquirers = topEntry(countBy(coupons, (coupon) => coupon.acquirer))
  const cancelledByProduct = topEntry(
    sumBy(
      coupons.filter((coupon) => coupon.status === 'cancelado'),
      (coupon) => coupon.productName,
    ),
  )

  const topProductsQty = summarizeTopEntries(productByQuantity.entries)
  const topProductsRevenue = summarizeTopEntries(productByRevenue.entries)
  const topStoresCoupons = summarizeTopEntries(storeByCoupons.entries)
  const topStoresRevenue = summarizeTopEntries(storeByRevenue.entries)
  const topPaymentMethods = summarizeTopEntries(paymentMethods.entries)
  const topAcquirers = summarizeTopEntries(acquirers.entries)
  const topCancelledProducts = summarizeTopEntries(cancelledByProduct.entries)

  return `Total de cupons: ${total}
Autorizados: ${authorized}
Cancelados: ${cancelled}
Faturamento total: ${formatCurrency(totalRevenue)}
Ticket medio autorizado: ${formatCurrency(avgTicket)}

Top produtos por quantidade: ${topProductsQty || 'sem dados'}
Top produtos por receita: ${topProductsRevenue || 'sem dados'}
Top lojas por cupons: ${topStoresCoupons || 'sem dados'}
Top lojas por receita: ${topStoresRevenue || 'sem dados'}
Top meios de pagamento: ${topPaymentMethods || 'sem dados'}
Top adquirentes: ${topAcquirers || 'sem dados'}
Produtos com mais cancelamentos: ${topCancelledProducts || 'sem dados'}`
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

  const asksMostExpensiveProduct =
    normalizedPrompt.includes('produto') &&
    (normalizedPrompt.includes('caro') ||
      normalizedPrompt.includes('mais caro') ||
      normalizedPrompt.includes('produto mais caro') ||
      normalizedPrompt.includes('valor mais alto') ||
      normalizedPrompt.includes('preco mais alto') ||
      normalizedPrompt.includes('preco maior'))

  if (asksMostExpensiveProduct) {
    let topCoupon = filtered[0]
    for (const coupon of filtered) {
      if (coupon.unitPrice > (topCoupon?.unitPrice ?? 0)) {
        topCoupon = coupon
      }
    }

    if (!topCoupon) return null

    const evidence = buildCouponEvidence(
      filtered.filter((coupon) => coupon.productName === topCoupon.productName).sort((a, b) => b.unitPrice - a.unitPrice),
      'Produto mais caro',
    )

    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `O produto mais caro ${label} e ${topCoupon.productName}, com preco unitario de ${formatCurrency(topCoupon.unitPrice)} (cupom ${topCoupon.couponNumber}, loja ${topCoupon.storeId}).`,
      evidence,
      [],
    )
  }

  const asksCheapestProduct =
    normalizedPrompt.includes('barat') ||
    normalizedPrompt.includes('mais barato') ||
    normalizedPrompt.includes('produto mais barato') ||
    normalizedPrompt.includes('valor mais baixo') ||
    normalizedPrompt.includes('preco mais baixo') ||
    normalizedPrompt.includes('preco mais barato')

  if (asksCheapestProduct) {
    let cheapestCoupon = filtered[0]
    for (const coupon of filtered) {
      if (coupon.unitPrice < (cheapestCoupon?.unitPrice ?? Infinity)) {
        cheapestCoupon = coupon
      }
    }

    if (!cheapestCoupon) return null

    const evidence = buildCouponEvidence(
      filtered.filter((coupon) => coupon.productName === cheapestCoupon.productName).sort((a, b) => a.unitPrice - b.unitPrice),
      'Produto mais barato',
    )

    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `O produto mais barato ${label} e ${cheapestCoupon.productName}, com preco unitario de ${formatCurrency(cheapestCoupon.unitPrice)} (cupom ${cheapestCoupon.couponNumber}, loja ${cheapestCoupon.storeId}).`,
      evidence,
      [],
    )
  }

  const asksMostSoldProduct =
    normalizedPrompt.includes('produto') &&
    (normalizedPrompt.includes('vend') ||
      normalizedPrompt.includes('mais vendido') ||
      normalizedPrompt.includes('produto mais vendido') ||
      normalizedPrompt.includes('maior venda') ||
      normalizedPrompt.includes('top produto') ||
      normalizedPrompt.includes('top produtos'))

  if (asksMostSoldProduct) {
    const ranking = topEntry(sumByQuantity(filtered, (coupon) => coupon.productName))
    if (!ranking.top) return null
    const [productName, quantity] = ranking.top
    const evidence = buildCouponEvidence(
      filtered.filter((coupon) => coupon.productName === productName).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      'Ranking de produtos por quantidade',
    )

    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `O produto mais vendido ${label} e ${productName}, com ${quantity} unidade${quantity === 1 ? '' : 's'} vendida${quantity === 1 ? '' : 's'}.`,
      evidence,
      ranking.entries.length > 1
        ? [`Segundo colocado: ${ranking.entries[1][0]} com ${ranking.entries[1][1]} unidade${ranking.entries[1][1] === 1 ? '' : 's'}.`]
        : [],
    )
  }

  const asksMostRevenueProduct =
    normalizedPrompt.includes('produto') &&
    hasAny(normalizedPrompt, ['faturament', 'receita', 'valor']) &&
    hasAny(normalizedPrompt, ['mais', 'top', 'maior'])

  if (asksMostRevenueProduct) {
    const ranking = topEntry(sumBy(filtered, (coupon) => coupon.productName))
    if (!ranking.top) return null
    const [productName, value] = ranking.top
    const evidence = buildCouponEvidence(
      filtered.filter((coupon) => coupon.productName === productName).sort((a, b) => b.amount - a.amount),
      'Ranking de produtos por receita',
    )

    return newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      `O produto com maior faturamento ${label} e ${productName}, com ${formatCurrency(value)}.`,
      evidence,
      ranking.entries.length > 1
        ? [`Segundo maior faturamento: ${ranking.entries[1][0]} com ${formatCurrency(ranking.entries[1][1])}.`]
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
  context?: string,
  conversation: AssistantConversationMessage[] = [],
): Promise<string | null> => {
  if (process.env.ASSISTANT_LLM_ENABLED !== 'true') return null

  const endpoint = process.env.ASSISTANT_LLM_ENDPOINT
  const apiKey = process.env.ASSISTANT_LLM_API_KEY
  const model = process.env.ASSISTANT_LLM_MODEL ?? 'gpt-4.1-mini'

  if (!endpoint || !apiKey) return null

  try {
    const conversationContext = conversation.length
      ? `Historico da conversa:\n${buildConversationPrompt(conversation)}\n\n`
      : ''

    const userContent = [
      conversationContext,
      `Pergunta: ${prompt}`,
      context ? `Contexto:\n${context}` : null,
      'Resposta base:',
      response.answer,
      response.warnings.length ? `Avisos: ${response.warnings.join('; ')}` : null,
    ]
      .filter(Boolean)
      .join('\n\n')

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
              'Voce e um assistente operacional que responde em portugues do Brasil. Nao invente dados. Use apenas as informacoes internas fornecidas. Seja claro, objetivo e mantenha numeros e fatos corretos. Use o historico da conversa quando a pergunta depender de seguimento ou fizer referencia a mensagens anteriores.',
          },
          {
            role: 'user',
            content: userContent,
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
  conversation: AssistantConversationMessage[] = [],
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

  if (response.status !== 'ok' && isOpenCouponQuestion(normalizedPrompt)) {
    const parsedQuery = await parseAssistantQueryWithLlm(prompt, coupons, conversation)
    if (parsedQuery) {
      const intentResponse = executeAssistantQuerySpec(profile, coupons, parsedQuery, 'na base atual')
      if (intentResponse?.status === 'ok') {
        const context = buildCouponContextSummary(coupons)
        const rewritten = await tryHumanizeAnswerWithLlm(prompt, intentResponse, context, conversation)
        if (rewritten) {
          return {
            ...intentResponse,
            answer: rewritten,
            warnings: ['Resposta redigida com apoio de LLM externo usando apenas contexto interno.', ...intentResponse.warnings],
          }
        }
        return intentResponse
      }
    }

    const context = buildCouponContextSummary(coupons)
    response = newResponse(
      profile,
      'metricas_operacionais',
      'ok',
      'Buscando a resposta com base nos dados internos de cupons e produtos.',
      buildCouponEvidence(coupons.slice(0, MAX_EVIDENCE_ITEMS), 'Contexto de cupons'),
      ['Consulta aberta usando contexto interno.'],
    )

    const rewritten = await tryHumanizeAnswerWithLlm(prompt, response, context, conversation)
    if (rewritten) {
      return {
        ...response,
        answer: rewritten,
        warnings: ['Resposta redigida com apoio de LLM externo usando apenas contexto interno.', ...response.warnings],
      }
    }

    return response
  }

  if (response.status === 'ok') {
    return response
  }

  const rewritten = await tryHumanizeAnswerWithLlm(prompt, response, undefined, conversation)
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
      const conversation = Array.isArray(body.conversation)
        ? body.conversation.filter(
            (item): item is AssistantConversationMessage =>
              item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string',
          )
        : []

      const rawResponse = await resolveAssistantResponse(prompt, body.userEmail, coupons, logs, conversation)
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
