import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore'
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
import { getFirebaseDb } from '../../firebase/client'

export class FirebaseCouponRepository implements CouponRepository {
  async list(): Promise<Coupon[]> {
    const db = getFirebaseDb()
    const snapshot = await getDocs(collection(db, 'coupons'))
    return snapshot.docs.map((item) => {
      const data = item.data() as Record<string, unknown>
      // Normaliza dados legados: status="agrupado" foi gravado incorretamente
      // pelo código antigo. Restaura status fiscal e define situacao corretamente.
      const isLegacy = data['status'] === 'agrupado'
      return {
        ...(data as unknown as Coupon),
        id: item.id,
        status: isLegacy ? 'autorizado' : (data['status'] as Coupon['status']),
        situacao: isLegacy && !data['situacao'] ? 'Agregado' : (data['situacao'] as Coupon['situacao']),
      }
    })
  }

  async updateAggregatorIds(payload: AggregatorPersistPayload[]): Promise<void> {
    const db = getFirebaseDb()
    const batch = writeBatch(db)

    payload.forEach((item) => {
      const ref = doc(db, 'coupons', item.couponId)
      batch.update(ref, { idAgregador: item.idAgregador, situacao: 'Agregado' })
    })

    await batch.commit()
  }

  async updateCouponSituacao(payload: CouponSituacaoPayload[]): Promise<void> {
    const db = getFirebaseDb()
    const batch = writeBatch(db)

    payload.forEach((item) => {
      const ref = doc(db, 'coupons', item.couponId)
      batch.update(ref, { situacao: item.situacao })
    })

    await batch.commit()
  }

  async removeAggregationData(couponIds: string[]): Promise<void> {
    const db = getFirebaseDb()
    const { deleteField } = await import('firebase/firestore')
    const batch = writeBatch(db)

    couponIds.forEach((couponId) => {
      const ref = doc(db, 'coupons', couponId)
      batch.update(ref, { 
        idAgregador: deleteField(),
        situacao: deleteField()
      })
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

export class FirebaseActivityLogRepository implements ActivityLogRepository {
  async add(log: Omit<ActivityLog, 'id'>): Promise<void> {
    const db = getFirebaseDb()
    await addDoc(collection(db, 'activityLogs'), log)
  }

  async list(maxResults = 200): Promise<ActivityLog[]> {
    const db = getFirebaseDb()
    const q = query(
      collection(db, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      fsLimit(maxResults),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog))
  }
}
