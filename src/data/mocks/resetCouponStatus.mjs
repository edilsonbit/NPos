/**
 * Reseta o status dos cupons no Firestore para a distribuição original:
 *   - índice % 5 === 0 → 'cancelado'
 *   - demais            → 'autorizado'
 * Remove também o campo idAgregador.
 *
 * Uso: node src/data/mocks/resetCouponStatus.mjs
 */
import { initializeApp } from 'firebase/app'
import { collection, deleteField, getDocs, getFirestore, writeBatch } from 'firebase/firestore'

const app = initializeApp({
  apiKey: 'AIzaSyCSugFTAyZBQAiaixEq0TIlGevf1y2T3sk',
  authDomain: 'ics-npos.firebaseapp.com',
  projectId: 'ics-npos',
})

const db = getFirestore(app)

async function run() {
  console.log('Buscando cupons...')
  const snapshot = await getDocs(collection(db, 'coupons'))
  console.log(`Total encontrado: ${snapshot.docs.length} documentos`)

  // Firestore batch tem limite de 500 ops
  const BATCH_SIZE = 400
  let batchOps = []
  let batchCount = 0
  let updated = 0

  const flush = async () => {
    if (batchOps.length === 0) return
    const batch = writeBatch(db)
    batchOps.forEach(({ ref, data }) => batch.update(ref, data))
    await batch.commit()
    batchCount++
    console.log(`  Batch ${batchCount} commitado (${batchOps.length} docs)`)
    batchOps = []
  }

  for (const docSnap of snapshot.docs) {
    const id = docSnap.id
    const match = id.match(/^C(\d+)$/)
    let status

    if (match) {
      const index = parseInt(match[1], 10)
      status = index % 5 === 0 ? 'cancelado' : 'autorizado'
    } else {
      // documento fora do padrão (ex: inserido manualmente) → autorizado
      status = 'autorizado'
    }

    batchOps.push({
      ref: docSnap.ref,
      data: { status, idAgregador: deleteField() },
    })
    updated++

    if (batchOps.length >= BATCH_SIZE) {
      await flush()
    }
  }

  await flush()

  console.log(`\n✅ Concluído! ${updated} cupons atualizados.`)
  const cancelados = snapshot.docs.filter((d) => {
    const m = d.id.match(/^C(\d+)$/)
    return m && parseInt(m[1], 10) % 5 === 0
  }).length
  console.log(`   → ${updated - cancelados} autorizados`)
  console.log(`   → ${cancelados} cancelados`)
  process.exit(0)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
