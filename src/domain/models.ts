export type CouponStatus = 'ativo' | 'cancelado'

export interface Product {
  id: string
  code: string
  name: string
  category: string
  brand: string
  price: number
}

export interface Coupon {
  id: string
  couponNumber: string
  nsu: string
  storeId: string
  acquirer: string
  paymentMethod: string
  status: CouponStatus
  createdAt: string
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  tax: number
  amount: number
  idAgregador: string | null
}

export interface CouponFilters {
  couponNumber: string
  nsu: string
  productSearch: string
  storeId: string
  acquirer: string
  paymentMethod: string
  status: '' | CouponStatus
  dateFrom: string
  dateTo: string
}

export interface AggregationCriteria {
  byProduct: boolean
  byStore: boolean
  byAcquirer: boolean
  byPaymentMethod: boolean
  byDate: boolean
}

export interface GroupFilters {
  idAgregador: string
  storeId: string
  acquirer: string
  paymentMethod: string
  productSearch: string
  dateFrom: string
  dateTo: string
}

export interface AggregatedCouponGroup {
  idAgregador: string
  aggregatedAt: string
  storeId: string
  date: string
  productCode: string
  productName: string
  acquirer: string
  paymentMethod: string
  coupons: Coupon[]
  totalAmount: number
}

export interface SapPayload {
  storeId: string
  idAgregador: string
  aggregatedAt: string
  productCode: string
  productName: string
  acquirer: string
  paymentMethod: string
  totalAmount: number
}

export interface AggregatorPersistPayload {
  couponId: string
  idAgregador: string
}
