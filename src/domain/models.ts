export type CouponStatus = 'autorizado' | 'cancelado'

export interface Product {
  id: string
  code: string
  name: string
  category: string
  brand: string
  price: number
}

export type CouponSituacao = 'Agregado' | 'Enviado ao ERP'

export interface Coupon {
  id: string
  couponNumber: string
  nsu: string
  storeId: string
  acquirer: string
  paymentMethod: string
  status: CouponStatus
  situacao?: CouponSituacao
  idAgregador?: string
  createdAt: string
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  tax: number
  amount: number
}

export interface CouponFilters {
  couponNumber: string
  nsu: string
  productSearch: string
  storeId: string
  acquirer: string
  paymentMethod: string
  status: '' | CouponStatus
  situacao: '' | CouponSituacao
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
  couponNumber: string
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
  couponIds: string[]
  coupons: Coupon[]
  totalAmount: number
}

export interface ErpPayloadItem {
  couponNumber: string
  nsu: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  tax: number
  amount: number
  status: CouponStatus
  createdAt: string
}

export interface ErpPayload {
  idAgregador: string
  storeId: string
  date: string
  aggregatedAt: string
  productCode: string
  productName: string
  acquirer: string
  paymentMethod: string
  totalAmount: number
  couponCount: number
  items: ErpPayloadItem[]
}

export interface AggregatorPersistPayload {
  couponId: string
  idAgregador: string
}

export interface CouponSituacaoPayload {
  couponId: string
  situacao: CouponSituacao
}

// --- Activity Log ---

export type ActivityLogAction =
  | 'AGREGAR_CUPONS'
  | 'DESFAZER_AGREGACAO'
  | 'ENVIAR_ERP'
  | 'CANCELAR_CUPOM'

export type ActivityLogStatus = 'sucesso' | 'erro'

export interface ActivityLog {
  id?: string
  timestamp: string
  action: ActivityLogAction
  description: string
  userId?: string
  status: ActivityLogStatus
  details?: {
    couponIds?: string[]
    groupIds?: string[]
    couponNumbers?: string[]
    count?: number
    errorMessage?: string
  }
}
