import { appConfig } from '../../config/appConfig'
import type {
  ActivityLogRepository,
  CouponRepository,
  ProductRepository,
} from '../../domain/repositories'
import {
  FirebaseActivityLogRepository,
  FirebaseCouponRepository,
  FirebaseProductRepository,
} from './firebaseRepositories'
import {
  MockActivityLogRepository,
  MockCouponRepository,
  MockProductRepository,
} from './mockRepositories'

interface DataLayer {
  coupons: CouponRepository
  products: ProductRepository
  activityLogs: ActivityLogRepository
}

export const createDataLayer = (): DataLayer => {
  if (appConfig.dataSource === 'firebase') {
    return {
      coupons: new FirebaseCouponRepository(),
      products: new FirebaseProductRepository(),
      activityLogs: new FirebaseActivityLogRepository(),
    }
  }

  return {
    coupons: new MockCouponRepository(),
    products: new MockProductRepository(),
    activityLogs: new MockActivityLogRepository(),
  }
}
