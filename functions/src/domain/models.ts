export type CouponStatus = 'autorizado' | 'cancelado'

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
  idAgregador?: string
}

export interface AggregationCriteria {
  byProduct: boolean
  byStore: boolean
  byAcquirer: boolean
  byPaymentMethod: boolean
  byDate: boolean
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
  couponIds: string[]
  coupons: Coupon[]
  totalAmount: number
}
