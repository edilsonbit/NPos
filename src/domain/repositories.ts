import type { ActivityLog, AggregatorPersistPayload, CouponSituacaoPayload, Coupon, Product } from './models'

export interface CouponRepository {
  list(): Promise<Coupon[]>
  updateAggregatorIds(payload: AggregatorPersistPayload[]): Promise<void>
  updateCouponSituacao(payload: CouponSituacaoPayload[]): Promise<void>
  removeAggregationData(couponIds: string[]): Promise<void>
}

export interface ProductRepository {
  list(): Promise<Product[]>
}

export interface ActivityLogRepository {
  add(log: Omit<ActivityLog, 'id'>): Promise<void>
  list(limit?: number): Promise<ActivityLog[]>
}
