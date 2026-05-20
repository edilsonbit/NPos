import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import admin from 'firebase-admin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectId = process.env.FIREBASE_PROJECT_ID || 'ics-npos'
const dryRun = process.argv.includes('--dry-run')

const couponsPath = path.resolve(__dirname, '../../src/data/mocks/coupons.mock.json')
const productsPath = path.resolve(__dirname, '../../src/data/mocks/products.mock.json')

const parseJson = async (filePath) => {
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw)
}

const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

const saveCollection = async (db, collectionName, docs) => {
  let written = 0
  for (const group of chunk(docs, 450)) {
    const batch = db.batch()
    for (const item of group) {
      const id = String(item.id)
      batch.set(db.collection(collectionName).doc(id), item, { merge: true })
    }
    if (!dryRun) {
      await batch.commit()
    }
    written += group.length
  }
  return written
}

const run = async () => {
  const [coupons, products] = await Promise.all([
    parseJson(couponsPath),
    parseJson(productsPath),
  ])

  if (!Array.isArray(coupons) || !Array.isArray(products)) {
    throw new Error('Arquivos de mock invalidos: esperado arrays em coupons e products.')
  }

  if (!admin.apps.length) {
    admin.initializeApp({ projectId })
  }

  const db = admin.firestore()

  const mode = dryRun ? 'DRY-RUN' : 'WRITE'
  console.log(`[seed-firestore] mode=${mode} projectId=${projectId}`)
  console.log(`[seed-firestore] coupons=${coupons.length} products=${products.length}`)

  const writtenCoupons = await saveCollection(db, 'coupons', coupons)
  const writtenProducts = await saveCollection(db, 'products', products)

  console.log(
    `[seed-firestore] completed coupons=${writtenCoupons} products=${writtenProducts}`,
  )
}

run().catch((error) => {
  console.error('[seed-firestore] failed:', error.message)
  console.error(
    '[seed-firestore] Dica: autentique com "npx firebase-tools login" e, se necessario, configure GOOGLE_APPLICATION_CREDENTIALS com uma service account JSON.',
  )
  process.exit(1)
})
