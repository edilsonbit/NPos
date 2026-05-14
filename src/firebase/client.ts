import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

let dbInstance: ReturnType<typeof getFirestore> | null = null
let emulatorConnected = false

export const getFirebaseDb = () => {
  if (dbInstance) {
    return dbInstance
  }

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const appId = import.meta.env.VITE_FIREBASE_APP_ID

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      'Firebase nao configurado. Defina VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID e VITE_FIREBASE_APP_ID.',
    )
  }

  const app = initializeApp({
    apiKey,
    authDomain,
    projectId,
    appId,
  })

  dbInstance = getFirestore(app)

  const useEmulator = import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true'
  if (useEmulator && !emulatorConnected) {
    const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST ?? '127.0.0.1'
    const emulatorPort = Number(import.meta.env.VITE_FIREBASE_EMULATOR_PORT ?? '8080')
    connectFirestoreEmulator(dbInstance, emulatorHost, emulatorPort)
    emulatorConnected = true
  }

  return dbInstance
}
