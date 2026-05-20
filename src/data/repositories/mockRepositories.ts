import couponsMock from '../mocks/coupons.mock.json'
import productsMock from '../mocks/products.mock.json'
import type {
  ActivityLog,
  AggregatorPersistPayload,
  Coupon,
  CouponSituacaoPayload,
  Product,
} from '../../domain/models'
import type {
  ActivityLogRepository,
  CouponRepository,
  ProductRepository,
} from '../../domain/repositories'

const couponsState: Coupon[] = structuredClone(couponsMock as Coupon[])
const productsState: Product[] = structuredClone(productsMock as Product[])

export class MockCouponRepository implements CouponRepository {
  async list(): Promise<Coupon[]> {
    return structuredClone(couponsState)
  }

  async updateAggregatorIds(_payload: AggregatorPersistPayload[]): Promise<void> {
    // idAgregador foi movido para AggregatedCouponGroup — nada a persistir no mock
  }

  async updateCouponSituacao(_payload: CouponSituacaoPayload[]): Promise<void> {
    // Mock - nada a fazer
  }

  async removeAggregationData(_couponIds: string[]): Promise<void> {
    // Mock - nada a fazer
  }
}

export class MockProductRepository implements ProductRepository {
  async list(): Promise<Product[]> {
    return structuredClone(productsState)
  }
}

const logsState: ActivityLog[] = []

export class MockActivityLogRepository implements ActivityLogRepository {
  async add(log: Omit<ActivityLog, 'id'>): Promise<void> {
    logsState.unshift({ ...log, id: `LOG-${Date.now()}` })
  }

  async list(_limit = 200): Promise<ActivityLog[]> {
    return structuredClone(logsState)
  }
}
