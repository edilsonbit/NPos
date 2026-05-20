import type { ActivityLog } from '../domain/models'
import { createDataLayer } from '../data/repositories'

const dataLayer = createDataLayer()

export const logActivity = async (log: Omit<ActivityLog, 'id'>): Promise<void> => {
  try {
    await dataLayer.activityLogs.add(log)
  } catch (err) {
    console.error('Falha ao gravar log de atividade:', err)
  }
}

export const loadActivityLogs = async (limit?: number): Promise<ActivityLog[]> => {
  return dataLayer.activityLogs.list(limit)
}
