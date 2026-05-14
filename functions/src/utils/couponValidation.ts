import type { Coupon } from '../domain/models.js'

const requiredStringFields: Array<keyof Coupon> = [
  'id',
  'couponNumber',
  'nsu',
  'storeId',
  'acquirer',
  'paymentMethod',
  'createdAt',
  'productId',
  'productCode',
  'productName',
]

export const validateCoupon = (coupon: unknown): { valid: true } | { valid: false; error: string } => {
  if (typeof coupon !== 'object' || coupon == null) {
    return { valid: false, error: 'Cupom invalido: esperado objeto.' }
  }

  const data = coupon as Record<string, unknown>

  for (const field of requiredStringFields) {
    if (typeof data[field] !== 'string' || data[field].trim().length === 0) {
      return { valid: false, error: `Campo obrigatorio invalido: ${field}` }
    }
  }

  if (data.status !== 'autorizado' && data.status !== 'cancelado') {
    return { valid: false, error: 'Campo status deve ser autorizado ou cancelado.' }
  }

  if (Number.isNaN(Date.parse(String(data.createdAt)))) {
    return { valid: false, error: 'Campo createdAt deve estar em formato ISO valido.' }
  }

  const numericFields: Array<keyof Coupon> = ['quantity', 'unitPrice', 'tax', 'amount']
  for (const field of numericFields) {
    if (typeof data[field] !== 'number' || Number.isNaN(data[field])) {
      return { valid: false, error: `Campo numerico invalido: ${field}` }
    }
  }

  if (Number(data.quantity) <= 0 || Number(data.amount) <= 0) {
    return { valid: false, error: 'Campos quantity e amount devem ser maiores que zero.' }
  }

  if (Number(data.unitPrice) < 0 || Number(data.tax) < 0) {
    return { valid: false, error: 'Campos unitPrice e tax nao podem ser negativos.' }
  }

  return { valid: true }
}
