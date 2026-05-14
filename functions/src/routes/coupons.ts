import { Router } from 'express'
import type { Firestore } from 'firebase-admin/firestore'
import type { Coupon } from '../domain/models.js'
import { validateApiKey } from '../middleware/apiKey.js'
import { validateCoupon } from '../utils/couponValidation.js'

type ImportRequestBody = {
  source?: string
  coupons?: unknown
}

export const createCouponsRouter = (db: Firestore): Router => {
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
        productSearch,
      } = req.query as Record<string, string | undefined>

      if (storeId) coupons = coupons.filter((item) => item.storeId === storeId)
      if (acquirer) coupons = coupons.filter((item) => item.acquirer === acquirer)
      if (paymentMethod) {
        coupons = coupons.filter((item) => item.paymentMethod === paymentMethod)
      }
      if (status) coupons = coupons.filter((item) => item.status === status)
      if (dateFrom) coupons = coupons.filter((item) => item.createdAt >= dateFrom)
      if (dateTo) coupons = coupons.filter((item) => item.createdAt <= `${dateTo}T23:59:59`)
      if (productSearch) {
        const q = productSearch.toLowerCase()
        coupons = coupons.filter(
          (item) =>
            item.productName.toLowerCase().includes(q) ||
            item.productCode.toLowerCase().includes(q),
        )
      }

      res.json({ total: coupons.length, coupons })
    } catch (error) {
      console.error('Erro em GET /cupons', error)
      res.status(500).json({ error: 'Erro interno ao listar cupons.' })
    }
  })

  router.get('/:id', validateApiKey, async (req, res) => {
    try {
      const doc = await db.collection('coupons').doc(req.params.id).get()
      if (!doc.exists) {
        res.status(404).json({ error: 'Cupom nao encontrado.' })
        return
      }

      res.json(doc.data())
    } catch (error) {
      console.error('Erro em GET /cupons/:id', error)
      res.status(500).json({ error: 'Erro interno ao buscar cupom.' })
    }
  })

  router.post('/importar', validateApiKey, async (req, res) => {
    const body = req.body as ImportRequestBody
    const source = body.source?.trim() || 'DESCONHECIDA'

    if (!Array.isArray(body.coupons) || body.coupons.length === 0) {
      res.status(400).json({
        error: 'Body invalido. Envie { source?: string, coupons: Coupon[] }',
      })
      return
    }

    const result = {
      timestamp: new Date().toISOString(),
      source,
      received: body.coupons.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; id: string; error: string }>,
    }

    for (let index = 0; index < body.coupons.length; index += 1) {
      const maybeCoupon = body.coupons[index]
      const validation = validateCoupon(maybeCoupon)

      if (!validation.valid) {
        const id =
          typeof maybeCoupon === 'object' && maybeCoupon != null && 'id' in maybeCoupon
            ? String((maybeCoupon as Record<string, unknown>).id)
            : 'UNKNOWN'

        result.errors.push({ index, id, error: validation.error })
        result.skipped += 1
        continue
      }

      const coupon = maybeCoupon as Coupon
      const ref = db.collection('coupons').doc(coupon.id)

      try {
        const existing = await ref.get()

        if (!existing.exists) {
          await ref.set(coupon)
          result.inserted += 1
          continue
        }

        const previous = existing.data() as Coupon
        if (JSON.stringify(previous) === JSON.stringify(coupon)) {
          result.skipped += 1
          continue
        }

        await ref.set(coupon, { merge: true })
        result.updated += 1
      } catch (error) {
        result.errors.push({
          index,
          id: coupon.id,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        })
        result.skipped += 1
      }
    }

    res.status(200).json(result)
  })

  return router
}
