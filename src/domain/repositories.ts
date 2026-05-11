import type { AggregatorPersistPayload, Coupon, Product } from './models'

export interface CouponRepository {
  list(): Promise<Coupon[]>
  updateAggregatorIds(payload: AggregatorPersistPayload[]): Promise<void>
}

export interface ProductRepository {
  list(): Promise<Product[]>
}
