import { Router } from 'express'
import type { Firestore } from 'firebase-admin/firestore'
import { aggregateCoupons } from '../domain/aggregateCoupons.js'
import type { AggregationCriteria, Coupon } from '../domain/models.js'
import { validateApiKey } from '../middleware/apiKey.js'

export const createAggregationRouter = (db: Firestore): Router => {
  const router = Router()

  router.get('/', validateApiKey, async (req, res) => {
    try {
      const snapshot = await db.collection('coupons').get()
      let coupons = snapshot.docs.map((doc) => doc.data() as Coupon)

      const {
        storeId,
        acquirer,
        paymentMethod,
        status,
        dateFrom,
        dateTo,
        byProduct,
        byStore,
        byAcquirer,
        byPaymentMethod,
        byDate,
      } = req.query as Record<string, string | undefined>

      if (storeId) coupons = coupons.filter((item) => item.storeId === storeId)
      if (acquirer) coupons = coupons.filter((item) => item.acquirer === acquirer)
      if (paymentMethod) {
        coupons = coupons.filter((item) => item.paymentMethod === paymentMethod)
      }
      if (status) coupons = coupons.filter((item) => item.status === status)
      if (dateFrom) coupons = coupons.filter((item) => item.createdAt >= dateFrom)
      if (dateTo) coupons = coupons.filter((item) => item.createdAt <= `${dateTo}T23:59:59`)

      const criteria: AggregationCriteria = {
        byProduct: byProduct === 'true',
        byStore: byStore === 'true',
        byAcquirer: byAcquirer === 'true',
        byPaymentMethod: byPaymentMethod === 'true',
        byDate: byDate === 'true',
      }

      const groups = aggregateCoupons(coupons, criteria)
      res.status(200).json({
        totalCupons: coupons.length,
        totalGrupos: groups.length,
        criteriosAplicados: criteria,
        grupos: groups,
      })
    } catch (error) {
      console.error('Erro em GET /agregacao', error)
      res.status(500).json({ error: 'Erro interno ao agregar cupons.' })
    }
  })

  return router
}
