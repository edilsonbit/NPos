import type { AggregatedCouponGroup, AggregationCriteria, Coupon } from './models'
import { normalizeText } from '../utils/textNormalization'

const buildGroupKey = (coupon: Coupon, criteria: AggregationCriteria): string => {
  const parts: string[] = []

  if (criteria.byProduct) {
    parts.push(`Produto:${coupon.productCode}`)
  }
  if (criteria.byStore) {
    parts.push(`Loja:${coupon.storeId}`)
  }
  if (criteria.byAcquirer) {
    parts.push(`Adquirente:${coupon.acquirer}`)
  }
  if (criteria.byPaymentMethod) {
    parts.push(`Pagamento:${coupon.paymentMethod}`)
  }
  if (criteria.byDate) {
    parts.push(`Data:${coupon.createdAt.slice(0, 10)}`)
  }

  if (parts.length === 0) {
    parts.push('Geral')
  }

  return parts.join(' | ')
}

const firstOf = (coupons: Coupon[], field: keyof Coupon): string => {
  const val = coupons[0]?.[field]
  return val != null ? String(val) : '-'
}

export const aggregateCoupons = (
  coupons: Coupon[],
  criteria: AggregationCriteria,
  idPrefix = `AG-${Date.now().toString(36).toUpperCase()}`,
): AggregatedCouponGroup[] => {
  const buckets = new Map<string, Coupon[]>()

  for (const coupon of coupons) {
    const key = buildGroupKey(coupon, criteria)
    const current = buckets.get(key)
    if (current) {
      current.push(coupon)
    } else {
      buckets.set(key, [coupon])
    }
  }

  const aggregatedAt = new Date().toISOString()

  return Array.from(buckets.entries()).map(([, groupedCoupons], index) => ({
    idAgregador: `${idPrefix}-${String(index + 1).padStart(3, '0')}`,
    aggregatedAt,
    storeId: firstOf(groupedCoupons, 'storeId'),
    date: firstOf(groupedCoupons, 'createdAt').slice(0, 10),
    productCode: firstOf(groupedCoupons, 'productCode'),
    productName: firstOf(groupedCoupons, 'productName'),
    acquirer: firstOf(groupedCoupons, 'acquirer'),
    paymentMethod: firstOf(groupedCoupons, 'paymentMethod'),
    couponIds: groupedCoupons.map((c) => c.id),
    coupons: groupedCoupons,
    totalAmount: Number(
      groupedCoupons.reduce((acc, item) => acc + item.amount, 0).toFixed(2),
    ),
  }))
}

export const reconstructAggregatedGroups = (
  coupons: Coupon[],
): AggregatedCouponGroup[] => {
  const isAggregatedSituation = (situacao?: string) => {
    const normalized = normalizeText(situacao)
    return normalized === normalizeText('Agregado') || normalized === normalizeText('Enviado ao ERP')
  }

  // Filtra apenas cupons que foram agregados (têm idAgregador)
  const agregados = coupons.filter((c) => c.idAgregador && isAggregatedSituation(c.situacao))

  // Agrupa por idAgregador
  const buckets = new Map<string, Coupon[]>()
  for (const coupon of agregados) {
    const id = coupon.idAgregador!
    const current = buckets.get(id)
    if (current) {
      current.push(coupon)
    } else {
      buckets.set(id, [coupon])
    }
  }

  // Reconstrói os grupos
  return Array.from(buckets.entries()).map(([idAgregador, groupedCoupons]) => ({
    idAgregador,
    aggregatedAt: groupedCoupons[0]?.createdAt || new Date().toISOString(),
    storeId: firstOf(groupedCoupons, 'storeId'),
    date: firstOf(groupedCoupons, 'createdAt').slice(0, 10),
    productCode: firstOf(groupedCoupons, 'productCode'),
    productName: firstOf(groupedCoupons, 'productName'),
    acquirer: firstOf(groupedCoupons, 'acquirer'),
    paymentMethod: firstOf(groupedCoupons, 'paymentMethod'),
    couponIds: groupedCoupons.map((c) => c.id),
    coupons: groupedCoupons,
    totalAmount: Number(
      groupedCoupons.reduce((acc, item) => acc + item.amount, 0).toFixed(2),
    ),
  }))
}
