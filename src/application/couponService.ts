import { aggregateCoupons } from '../domain/aggregateCoupons'
import type {
  AggregatedCouponGroup,
  AggregationCriteria,
  Coupon,
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
