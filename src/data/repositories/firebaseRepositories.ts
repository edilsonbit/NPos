import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import type {
  AggregatorPersistPayload,
  Coupon,
  Product,
} from '../../domain/models'
import type {
  CouponRepository,
  ProductRepository,
} from '../../domain/repositories'
import { getFirebaseDb } from '../../firebase/client'

export class FirebaseCouponRepository implements CouponRepository {
  async list(): Promise<Coupon[]> {
    const db = getFirebaseDb()
    const snapshot = await getDocs(collection(db, 'coupons'))
    return snapshot.docs.map((item) => item.data() as Coupon)
  }

  async updateAggregatorIds(payload: AggregatorPersistPayload[]): Promise<void> {
    const db = getFirebaseDb()
    const batch = writeBatch(db)

    payload.forEach((item) => {
      const ref = doc(db, 'coupons', item.couponId)
      batch.update(ref, { idAgregador: item.idAgregador, status: 'agrupado' })
    })

    await batch.commit()
  }
}

export class FirebaseProductRepository implements ProductRepository {
  async list(): Promise<Product[]> {
    const db = getFirebaseDb()
    const snapshot = await getDocs(collection(db, 'products'))
    return snapshot.docs.map((item) => item.data() as Product)
  }
}
