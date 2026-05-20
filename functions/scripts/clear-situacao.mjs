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
  const snapshot = await db.collection('coupons').get()

  const toUpdate = snapshot.docs.filter((d) => d.data().situacao !== undefined)
  console.log(`Total de cupons com situacao: ${toUpdate.length}`)

  if (toUpdate.length === 0) {
    console.log('Nenhum documento para atualizar.')
    return
  }

  if (dryRun) {
    console.log('[DRY-RUN] Nenhuma escrita realizada.')
    return
  }

  let updated = 0
  for (const group of chunk(toUpdate, 450)) {
    const batch = db.batch()
    for (const docSnap of group) {
      batch.update(docSnap.ref, {
        situacao: admin.firestore.FieldValue.delete(),
        idAgregador: admin.firestore.FieldValue.delete(),
      })
    }
    await batch.commit()
    updated += group.length
    console.log(`  ${updated} documentos atualizados...`)
  }

  console.log(`\nConcluído! ${updated} cupons tiveram situacao e idAgregador removidos.`)
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
