import couponsMock from '../mocks/coupons.mock.json'
import productsMock from '../mocks/products.mock.json'
import type {
  AggregatorPersistPayload,
  Coupon,
  Product,
} from '../../domain/models'
import type {
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
}

export class MockProductRepository implements ProductRepository {
  async list(): Promise<Product[]> {
    return structuredClone(productsState)
  }
}
