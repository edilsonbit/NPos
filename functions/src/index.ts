import cors from 'cors'
import express from 'express'
import { onRequest } from 'firebase-functions/v2/https'
import admin from 'firebase-admin'
import { createCouponsRouter } from './routes/coupons.js'
import { createAggregationRouter } from './routes/aggregation.js'

admin.initializeApp()
const db = admin.firestore()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'npos-api' })
})

app.use('/cupons', createCouponsRouter(db))
app.use('/agregacao', createAggregationRouter(db))

export const api = onRequest({ region: 'southamerica-east1' }, app)
