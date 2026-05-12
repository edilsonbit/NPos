/**
 * Script para gerar coupons.mock.json com grupos ricos (vários cupons por grupo).
 * Estratégia: cada loja tem 1 adquirente fixo + 3 formas de pagamento + 5 dias + 6 produtos
 * → 5 × 1 × 3 × 5 × 6 = 450 grupos possíveis
 * → ~2700 linhas de NF (6 por grupo em média)
 *
 * O mesmo número de NF aparece em múltiplos grupos pois uma NF pode ter 2-3 produtos.
 * Isso demonstra ao gerente que a mesma NF pode aparecer em várias agregações.
 *
 * Executar: node src/data/mocks/generateMock.mjs
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------- Configuração fixa por loja ----------
const storeConfig = {
  LJ001: { acquirer: 'Cielo',   products: ['COD-10001','COD-10006','COD-10011','COD-10016','COD-10021','COD-10026'] },
  LJ014: { acquirer: 'Stone',   products: ['COD-20001','COD-20006','COD-20011','COD-20016','COD-20021','COD-20026'] },
  LJ021: { acquirer: 'Rede',    products: ['COD-30001','COD-30006','COD-30011','COD-30016','COD-30021','COD-30026'] },
  LJ089: { acquirer: 'Getnet',  products: ['COD-40001','COD-40006','COD-40011','COD-40016','COD-40021','COD-40026'] },
  LJ110: { acquirer: 'Cielo',   products: ['COD-50001','COD-50006','COD-50011','COD-50016','COD-50021','COD-50026'] },
}

const paymentMethods = ['PIX', 'Cartão de Crédito', 'Dinheiro', 'Cartão de Débito']
const statuses = ['autorizado', 'autorizado', 'autorizado', 'autorizado', 'cancelado']

const dates = [
  '2026-03-01', '2026-03-02', '2026-03-03',
]

// Catálogo de produtos compartilhado (nome por código)
const productCatalog = {
  'COD-10001': { name: 'Maquiagem Eudora Premium 1',    price: 79.90 },
  'COD-10006': { name: 'Perfumaria Eudora Essencial 6',  price: 139.90 },
  'COD-10011': { name: 'Infantil Eudora Premium 11',     price: 49.90 },
  'COD-10016': { name: 'Skincare Eudora Essencial 16',   price: 89.90 },
  'COD-10021': { name: 'Cabelos Boticario Premium 21',   price: 34.90 },
  'COD-10026': { name: 'Corpo Boticario Essencial 26',   price: 29.90 },

  'COD-20001': { name: 'Maquiagem QDB Premium 1',        price: 69.90 },
  'COD-20006': { name: 'Perfumaria QDB Essencial 6',     price: 129.90 },
  'COD-20011': { name: 'Skincare QDB Premium 11',        price: 94.90 },
  'COD-20016': { name: 'Cabelos QDB Essencial 16',       price: 44.90 },
  'COD-20021': { name: 'Corpo QDB Premium 21',           price: 24.90 },
  'COD-20026': { name: 'Infantil QDB Essencial 26',      price: 54.90 },

  'COD-30001': { name: 'Maquiagem Vult Premium 1',       price: 59.90 },
  'COD-30006': { name: 'Perfumaria Vult Essencial 6',    price: 119.90 },
  'COD-30011': { name: 'Skincare Vult Premium 11',       price: 84.90 },
  'COD-30016': { name: 'Cabelos Vult Essencial 16',      price: 39.90 },
  'COD-30021': { name: 'Corpo Vult Premium 21',          price: 22.90 },
  'COD-30026': { name: 'Infantil Vult Essencial 26',     price: 49.90 },

  'COD-40001': { name: 'Maquiagem OUi Premium 1',        price: 89.90 },
  'COD-40006': { name: 'Perfumaria OUi Essencial 6',     price: 149.90 },
  'COD-40011': { name: 'Skincare OUi Premium 11',        price: 99.90 },
  'COD-40016': { name: 'Cabelos OUi Essencial 16',       price: 54.90 },
  'COD-40021': { name: 'Corpo OUi Premium 21',           price: 28.90 },
  'COD-40026': { name: 'Infantil OUi Essencial 26',      price: 44.90 },

  'COD-50001': { name: 'Maquiagem Boticario Premium 1',  price: 74.90 },
  'COD-50006': { name: 'Perfumaria Boticario Essencial 6', price: 134.90 },
  'COD-50011': { name: 'Skincare Boticario Premium 11',  price: 79.90 },
  'COD-50016': { name: 'Cabelos Boticario Essencial 16', price: 42.90 },
  'COD-50021': { name: 'Corpo Boticario Premium 21',     price: 26.90 },
  'COD-50026': { name: 'Infantil Boticario Essencial 26', price: 38.90 },
}

// ---------- Geração de NFs ----------
// Cada NF tem 1, 2 ou 3 produtos (linhas de cupom).
// A mesma paymentMethod é usada para todos os produtos de uma NF.
// O mesmo acquirer (fixo por loja) é usado para todos os produtos de uma NF.
// Isso garante que a NF apareça em múltiplos grupos de agregação (um por produto).

const coupons = []
let couponIdSeq = 1
let nfSeq = 700001

// Para cada combinação grupo-chave (loja, acquirer, payMethod, data), 
// geramos 8 NFs, cada uma com 1-3 produtos do catálogo da loja.
// → ~8 linhas por grupo × 450 grupos = ~3600 linhas
// → mas como 40% das NFs têm 2+ produtos, há NFs repetidas em múltiplos grupos

for (const [storeId, { acquirer, products }] of Object.entries(storeConfig)) {
  for (const date of dates) {
    for (const payMethod of paymentMethods) {
      // Gera 4 NFs neste "slot" (loja+data+pagamento)
      for (let nfIdx = 0; nfIdx < 4; nfIdx++) {
        const nfNumber = `NF-${nfSeq++}`
        const nfNsu = String(900000000 + nfSeq)  // NSU é por NF — compartilhado entre todos os itens
        const nfTime = `${date}T${String(8 + (nfIdx * 2) % 10).padStart(2,'0')}:${String((nfIdx * 7) % 60).padStart(2,'0')}:00.000Z`

        // Quantos produtos nesta NF? Mínimo 2: distribuição 2x→60%, 3x→40%
        const rand = (couponIdSeq * 7 + nfIdx * 13) % 10
        const numProducts = rand < 6 ? 2 : 3

        // Escolhe produtos sem repetição para esta NF
        const shuffled = [...products].sort((a, b) => {
          const h = (str) => str.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), nfIdx * 17)
          return h(a + nfIdx) % 7 - h(b + nfIdx) % 7
        })
        const chosenProducts = shuffled.slice(0, numProducts)

        for (const prodCode of chosenProducts) {
          const prod = productCatalog[prodCode]
          const qty = ((couponIdSeq * 3 + nfIdx) % 3) + 1
          const unitPrice = Number((prod.price + ((couponIdSeq % 9) - 4) * 0.47).toFixed(2))
          const tax = Number((unitPrice * qty * 0.065).toFixed(2))
          const amount = Number((qty * unitPrice + tax).toFixed(2))
          const statusIdx = (couponIdSeq * 11 + nfIdx * 3) % statuses.length
          const prodIdx = products.indexOf(prodCode)

          coupons.push({
            id: `C${String(couponIdSeq).padStart(5, '0')}`,
            couponNumber: nfNumber,
            nsu: nfNsu,
            storeId,
            acquirer,
            paymentMethod: payMethod,
            status: statuses[statusIdx],
            createdAt: nfTime,
            productId: `P${String(prodIdx + 1).padStart(4, '0')}`,
            productCode: prodCode,
            productName: prod.name,
            quantity: qty,
            unitPrice,
            tax,
            amount,
          })

          couponIdSeq++
        }
      }
    }
  }
}

const outPath = join(__dirname, 'coupons.mock.json')
writeFileSync(outPath, JSON.stringify(coupons, null, 2), 'utf-8')

// Stats
const nfCount = new Set(coupons.map(c => c.couponNumber)).size
console.log(`✅ Gerado: ${coupons.length} linhas, ${nfCount} NFs distintas`)
console.log(`   Lojas: 5 | Adquirentes: 1/loja | Pagamentos: ${paymentMethods.length} | Dias: ${dates.length} | Produtos/loja: 6`)
console.log(`   Grupos esperados (todos critérios): 5×1×4×3×6 = ${5*1*4*3*6}`)
console.log(`   Média por grupo: ~${(coupons.length / (5*1*3*5*6)).toFixed(1)} linhas`)
