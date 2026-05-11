import type { Coupon, CouponStatus, Product } from '../../domain/models'

const stores = ['LJ001', 'LJ014', 'LJ021', 'LJ089', 'LJ110']
const acquirers = ['Cielo', 'Stone', 'Rede', 'Getnet']
const paymentMethods = ['Credito', 'Debito', 'Pix', 'Voucher']

export const createProduct = (index: number, overrides?: Partial<Product>): Product => {
  const categories = ['Perfumaria', 'Maquiagem', 'Corpo e Banho', 'Cabelos', 'Skincare']
  const brands = ['Boticario', 'Eudora', 'Quem Disse Berenice', 'Vult', 'OUi']
  const category = categories[index % categories.length]
  const brand = brands[index % brands.length]
  const price = Number((14 + (index % 17) * 7.35 + (index % 5) * 2.1).toFixed(2))

  return {
    id: `P${String(index).padStart(4, '0')}`,
    code: `COD-${String(10000 + index)}`,
    name: `${category} ${brand} ${index % 2 === 0 ? 'Essencial' : 'Premium'} ${index}`,
    category,
    brand,
    price,
    ...overrides,
  }
}

export const createCoupon = (index: number, product: Product, overrides?: Partial<Coupon>): Coupon => {
  const qty = (index % 4) + 1
  const unitPrice = Number((product.price + ((index % 9) - 4) * 0.47).toFixed(2))
  const tax = Number((unitPrice * qty * 0.07).toFixed(2))
  const amount = Number((qty * unitPrice + tax).toFixed(2))
  const ts = new Date(new Date('2026-03-01T08:00:00Z').getTime() + index * 3600 * 1000 * 4).toISOString()
  const statuses: CouponStatus[] = ['ativo', 'ativo', 'ativo', 'cancelado']

  return {
    id: `C${String(index).padStart(5, '0')}`,
    couponNumber: `NF-${String(700000 + index)}`,
    nsu: String(900000000 + index),
    storeId: stores[index % stores.length],
    acquirer: acquirers[index % acquirers.length],
    paymentMethod: paymentMethods[index % paymentMethods.length],
    status: statuses[index % statuses.length],
    createdAt: ts,
    productId: product.id,
    productCode: product.code,
    productName: product.name,
    quantity: qty,
    unitPrice,
    tax,
    amount,
    idAgregador: null,
    ...overrides,
  }
}
