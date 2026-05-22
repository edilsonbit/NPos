import { createDataLayer } from '../data/repositories'
import type { ActivityLog, Coupon } from '../domain/models'
import { normalizeText } from '../utils/textNormalization'

const dataLayer = createDataLayer()

export type EmbeddedAiUserProfile = 'operador' | 'analista' | 'administrador'
export type EmbeddedAiQueryType =
  | 'cancelados_por_data'
  | 'status_agrupamento_cupom'
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
}

export interface EmbeddedAiRequest {
  prompt: string
  userEmail?: string
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

const findCancelledByDate = (coupons: Coupon[], prompt: string) => {
  const dateKey = parseDateInput(prompt)
  if (!dateKey) return null

  const matches = coupons.filter(
    (coupon) => coupon.status === 'cancelado' && coupon.createdAt.slice(0, 10) === dateKey,
  )

  return { dateKey, matches }
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
  const recentLogs = logs.slice(0, 10)
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

export const askEmbeddedAssistant = async ({
  prompt,
  userEmail,
}: EmbeddedAiRequest): Promise<EmbeddedAiResponse> => {
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

    if (normalizedPrompt.includes('cancelad')) {
      const payload = findCancelledByDate(coupons, normalizedPrompt)
      if (!payload?.dateKey) {
        return newResponse(
          profile,
          'cancelados_por_data',
          'insufficient_context',
          'Não consegui identificar a data. Use o formato DD/MM/AA ou DD/MM/AAAA.',
        )
      }

      const evidence = payload.matches.slice(0, 10).map((coupon) => ({
        source: 'coupons' as const,
        recordId: coupon.id,
        snippet: `Cupom ${coupon.couponNumber} cancelado em ${coupon.createdAt.slice(0, 10)} (loja ${coupon.storeId}).`,
      }))

      return newResponse(
        profile,
        'cancelados_por_data',
        'ok',
        payload.matches.length > 0
          ? `Foram encontrados ${payload.matches.length} cupom(ns) cancelado(s) em ${payload.dateKey}.`
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

      const evidence = payload.matches.slice(0, 10).map((coupon) => ({
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
      const evidence = summary.recentLogs.slice(0, 10).map((log) => ({
        source: 'activityLogs' as const,
        recordId: log.id ?? log.timestamp,
        snippet: `${log.action} | ${log.status} | ${log.description}`,
      }))

      return newResponse(
        profile,
        'resumo_logs',
        'ok',
        `Últimos ${summary.recentLogs.length} log(s): ${summary.success} sucesso(s), ${summary.errors} erro(s). Ações mais frequentes: ${summary.topActions.join(' | ') || 'sem dados'}.`,
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
