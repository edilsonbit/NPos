import { aggregateCoupons } from '../domain/aggregateCoupons'
import type {
  AggregatedCouponGroup,
  AggregationCriteria,
  Coupon,
  CouponSituacao,
  Product,
} from '../domain/models'
import { createDataLayer } from '../data/repositories'

const dataLayer = createDataLayer()

export const loadCouponsAndProducts = async (): Promise<{
  coupons: Coupon[]
  products: Product[]
}> => {
  const [coupons, products] = await Promise.all([
    dataLayer.coupons.list(),
    dataLayer.products.list(),
  ])

  return { coupons, products }
}

export const aggregateAndPersistCoupons = async (
  coupons: Coupon[],
  criteria: AggregationCriteria,
): Promise<AggregatedCouponGroup[]> => {
  const groups = aggregateCoupons(coupons, criteria)

  await dataLayer.coupons.updateAggregatorIds(
    groups.flatMap((group) =>
      group.coupons.map((coupon) => ({
        couponId: coupon.id,
        idAgregador: group.idAgregador,
      })),
    ),
  )

  return groups
}

export const undoAggregation = async (groupId: string): Promise<void> => {
  const { coupons } = await loadCouponsAndProducts()
  
  // Encontrar todos os coupons do grupo
  const groupCoupons = coupons.filter((c) => c.idAgregador === groupId)
  if (groupCoupons.length === 0) return
  
  // Remover dados de agregação
  const couponIds = groupCoupons.map((c) => c.id)
  await dataLayer.coupons.removeAggregationData(couponIds)
}

export const undoAggregationByNumbers = async (couponNumbers: string[]): Promise<void> => {
  const { coupons } = await loadCouponsAndProducts()
  
  // Encontrar TODOS os coupons (em qualquer agregacao) que tem esses couponNumbers
  const couponIdsToRemove = coupons
    .filter((c) => couponNumbers.includes(c.couponNumber))
    .map((c) => c.id)
  
  if (couponIdsToRemove.length === 0) return
  
  // Remover dados de agregação de todos eles
  await dataLayer.coupons.removeAggregationData(couponIdsToRemove)
}

export const updateCouponsSituacao = async (
  couponIds: string[],
  situacao: CouponSituacao,
): Promise<void> => {
  await dataLayer.coupons.updateCouponSituacao(
    couponIds.map((id) => ({
      couponId: id,
      situacao,
    })),
  )
}


