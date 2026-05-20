/**
 * Migração: corrige documentos com status="agrupado" no Firestore.
 *
 * O código antigo gravava status="agrupado" ao agregar cupons, sobrescrevendo
 * o status fiscal original (autorizado/cancelado). Este script:
 *   - Lê todos os documentos da coleção "coupons"
 *   - Para cada um com status="agrupado":
 *       status  → "autorizado"  (status fiscal original, conservador)
 *       situacao → "Agregado"   (campo de workflow)
 *
 * Uso:
 *   node functions/scripts/migrate-status.mjs
 *   node functions/scripts/migrate-status.mjs --dry-run   (apenas simula)
 */

import admin from 'firebase-admin'

const projectId = process.env.FIREBASE_PROJECT_ID || 'ics-npos'
const dryRun = process.argv.includes('--dry-run')

const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const run = async () => {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId })
  }

  const db = admin.firestore()
  const mode = dryRun ? 'DRY-RUN' : 'WRITE'
  console.log(`[migrate-status] mode=${mode} projectId=${projectId}`)

  const snapshot = await db.collection('coupons').where('status', '==', 'agrupado').get()

  if (snapshot.empty) {
    console.log('[migrate-status] Nenhum documento com status="agrupado" encontrado. Nada a fazer.')
    return
  }

  console.log(`[migrate-status] Documentos encontrados com status="agrupado": ${snapshot.size}`)

  const docs = snapshot.docs
  let updated = 0

  for (const group of chunk(docs, 450)) {
    const batch = db.batch()
    for (const doc of group) {
      batch.update(doc.ref, {
        status: 'autorizado',
        situacao: 'Agregado',
      })
    }
    if (!dryRun) {
      await batch.commit()
    }
    updated += group.length
    console.log(`[migrate-status] ${dryRun ? '[DRY-RUN] Simulado' : 'Atualizado'}: ${updated}/${docs.length}`)
  }

  console.log(`[migrate-status] Concluído. ${updated} documento(s) ${dryRun ? 'seriam atualizados' : 'atualizados'}.`)
}

run().catch((error) => {
  console.error('[migrate-status] Falhou:', error.message)
  console.error('[migrate-status] Dica: autentique com "npx firebase-tools login" ou configure GOOGLE_APPLICATION_CREDENTIALS.')
  process.exit(1)
})
