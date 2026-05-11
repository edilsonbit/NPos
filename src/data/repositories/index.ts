import { appConfig } from '../../config/appConfig'
import type {
  CouponRepository,
  ProductRepository,
} from '../../domain/repositories'
import {
  FirebaseCouponRepository,
  FirebaseProductRepository,
} from './firebaseRepositories'
import { MockCouponRepository, MockProductRepository } from './mockRepositories'

interface DataLayer {
  coupons: CouponRepository
  products: ProductRepository
}

export const createDataLayer = (): DataLayer => {
  if (appConfig.dataSource === 'firebase') {
    return {
      coupons: new FirebaseCouponRepository(),
      products: new FirebaseProductRepository(),
    }
  }

  return {
    coupons: new MockCouponRepository(),
    products: new MockProductRepository(),
  }
}
