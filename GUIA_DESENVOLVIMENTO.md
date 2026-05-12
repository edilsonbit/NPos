# NPos — Agrupador de Cupons Fiscais
## Guia Técnico de Desenvolvimento

> **Contexto:** Este documento descreve a arquitetura da POC, o estado atual do projeto e tudo o que precisa ser feito ou substituído para que o sistema vá para desenvolvimento real (produção).

---

## 1. Visão Geral do Sistema

O **NPos** é um módulo de conciliação fiscal que agrupa Cupons Fiscais (NFs) por critérios configuráveis e envia os agrupamentos ao SAP.

### Fluxo principal

```
[Login] → [Cupons Fiscais] → [Configurar Critérios] → [Rodar Agregador]
       → [Visão Agrupada] → [Enviar para SAP]
```

### Critérios de agrupamento disponíveis

| Critério       | Campo utilizado         |
|----------------|-------------------------|
| Por Produto    | `Coupon.productCode`    |
| Por Loja       | `Coupon.storeId`        |
| Por Adquirente | `Coupon.acquirer`       |
| Por Pagamento  | `Coupon.paymentMethod`  |
| Por Data       | `Coupon.createdAt` (dia)|

A combinação ativa dos critérios forma uma **chave de grupo**. Cupons com a mesma chave são agregados juntos. Uma mesma NF com múltiplos produtos **aparecerá em múltiplos grupos** (um por produto), o que é o comportamento correto.

---

## 2. Estrutura de Pastas

```
src/
├── App.tsx                        # Orquestrador principal: estado global, roteamento de páginas
├── main.tsx                       # Ponto de entrada React + providers (MUI, DatePicker)
│
├── domain/                        # ★ Regras de negócio puras — NÃO dependem de framework
│   ├── models.ts                  #   Todas as interfaces TypeScript
│   ├── repositories.ts            #   Contratos (interfaces) dos repositórios
│   └── aggregateCoupons.ts        #   Algoritmo de agrupamento puro
│
├── application/                   # Casos de uso — orquestram domínio + repositórios
│   └── couponService.ts           #   loadCouponsAndProducts, aggregateAndPersistCoupons
│
├── config/
│   └── appConfig.ts               # Lê VITE_DATA_SOURCE e decide mock vs. firebase
│
├── data/
│   ├── repositories/
│   │   ├── index.ts               # ★ FACTORY — decide qual repositório instanciar
│   │   ├── mockRepositories.ts    #   Implementação com dados em memória (JSON)
│   │   └── firebaseRepositories.ts#   Implementação com Firestore
│   └── mocks/
│       ├── coupons.mock.json      #   600 linhas de cupons para desenvolvimento
│       ├── products.mock.json     #   Catálogo de produtos
│       └── generateMock.mjs      #   Script Node.js para regenerar o mock
│
├── firebase/
│   └── client.ts                  # Inicialização lazy do Firestore
│
└── components/
    ├── auth/LoginPage.tsx          #   Tela de login (autenticação simulada)
    ├── layout/
    │   ├── AppShell.tsx            #   Layout master com sidebar
    │   └── Sidebar.tsx             #   Navegação lateral
    ├── coupons/
    │   ├── CouponFiltersBar.tsx    #   Filtros da tela de cupons
    │   └── CouponTable.tsx         #   Tabela paginada de cupons
    └── aggregator/
        ├── AggregatorConfig.tsx    #   5 checkboxes de critérios
        ├── AgregadorPage.tsx       #   Tela de visão agrupada com filtros
        ├── AggregatedView.tsx      #   Accordions dos grupos (memoizado)
        ├── SapPayloadDialog.tsx    #   Modal com payload enviado ao SAP
        └── SapPayloadDialog.tsx
```

---

## 3. Modelos de Dados (TypeScript)

### `Coupon` — linha de cupom fiscal
```ts
interface Coupon {
  id: string            // UUID único da linha
  couponNumber: string  // Ex: "NF-700001" — número da nota fiscal
  nsu: string           // Número Sequencial Único da transação
  storeId: string       // Ex: "LJ001"
  acquirer: string      // Ex: "Cielo", "Stone", "Rede", "Getnet"
  paymentMethod: string // "PIX" | "Cartão de Crédito" | "Dinheiro" | "Cartão de Débito"
  status: 'autorizado' | 'cancelado'
  createdAt: string     // ISO 8601 — "2026-03-01T08:00:00.000Z"
  productId: string
  productCode: string   // Ex: "COD-10001"
  productName: string
  quantity: number
  unitPrice: number
  tax: number
  amount: number        // = quantity * unitPrice + tax
}
```

> **Atenção:** Uma NF (número de nota fiscal) pode gerar **N linhas de Coupon** — uma por produto. Isso é intencional. O campo `couponNumber` repete entre linhas da mesma NF.

### `AggregatedCouponGroup` — resultado do agrupamento
```ts
interface AggregatedCouponGroup {
  idAgregador: string   // Ex: "AG-MP2SE7B2-001" (gerado pelo algoritmo)
  aggregatedAt: string  // ISO 8601 — quando o agrupamento foi executado
  storeId: string
  date: string          // YYYY-MM-DD
  productCode: string
  productName: string
  acquirer: string
  paymentMethod: string
  couponIds: string[]   // IDs das linhas de Coupon incluídas
  coupons: Coupon[]     // Objetos completos (para exibição)
  totalAmount: number
}
```

### `SapPayload` — estrutura enviada ao SAP
```ts
interface SapPayload {
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
  items: SapPayloadItem[] // Detalhes de cada cupom incluído
}
```

---

## 4. Arquitetura em Camadas (Padrão Repository)

O projeto usa o padrão **Repository + Factory** para desacoplar a fonte de dados da lógica de negócio:

```
App.tsx
  └── couponService.ts (application)
        └── createDataLayer() (factory)
              ├── [mock]     MockCouponRepository / MockProductRepository
              └── [firebase] FirebaseCouponRepository / FirebaseProductRepository
```

O `createDataLayer()` em `src/data/repositories/index.ts` é o **único ponto** que decide qual implementação usar, baseado na variável de ambiente `VITE_DATA_SOURCE`.

---

## 5. ★ O QUE MUDAR PARA API EXTERNA (REST/GraphQL)

Quando o backend real estiver disponível, **apenas dois arquivos precisam ser criados ou modificados**. O resto do sistema permanece intacto.

### Passo 1 — Criar `ApiCouponRepository.ts`

Crie `src/data/repositories/apiRepositories.ts` implementando os mesmos contratos:

```ts
import type { Coupon, Product, AggregatorPersistPayload } from '../../domain/models'
import type { CouponRepository, ProductRepository } from '../../domain/repositories'

// URL base da API — virá de variável de ambiente
const BASE_URL = import.meta.env.VITE_API_BASE_URL

const authHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${sessionStorage.getItem('token') ?? ''}`,
})

export class ApiCouponRepository implements CouponRepository {
  async list(): Promise<Coupon[]> {
    // Adapte os query params conforme a API real
    const res = await fetch(`${BASE_URL}/cupons`, { headers: authHeader() })
    if (!res.ok) throw new Error('Erro ao buscar cupons')
    return res.json() as Promise<Coupon[]>
  }

  async updateAggregatorIds(payload: AggregatorPersistPayload[]): Promise<void> {
    // Endpoint que registra o resultado do agrupamento
    const res = await fetch(`${BASE_URL}/cupons/agregar`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Erro ao persistir agrupamento')
  }
}

export class ApiProductRepository implements ProductRepository {
  async list(): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/produtos`, { headers: authHeader() })
    if (!res.ok) throw new Error('Erro ao buscar produtos')
    return res.json() as Promise<Product[]>
  }
}
```

### Passo 2 — Registrar na factory (`src/data/repositories/index.ts`)

```ts
// ADICIONAR o import:
import { ApiCouponRepository, ApiProductRepository } from './apiRepositories'

export const createDataLayer = (): DataLayer => {
  if (appConfig.dataSource === 'firebase') { ... }

  // ADICIONAR este bloco:
  if (appConfig.dataSource === 'api') {
    return {
      coupons: new ApiCouponRepository(),
      products: new ApiProductRepository(),
    }
  }

  // fallback: mock
  return { ... }
}
```

### Passo 3 — Adicionar o novo tipo em `appConfig.ts`

```ts
// src/config/appConfig.ts
type DataSourceMode = 'mock' | 'firebase' | 'api'   // ← adicionar 'api'
```

### Passo 4 — Definir variáveis de ambiente

```env
# .env.production
VITE_DATA_SOURCE=api
VITE_API_BASE_URL=https://api.suaempresa.com.br/npos/v1
```

---

## 6. Autenticação — O que mudar

### Estado atual (POC)
O login em `src/components/auth/LoginPage.tsx` **não valida credenciais** — qualquer usuário/senha passa. A função `handleSubmit` chama `onLogin()` diretamente.

### Para produção

**Opção A — OAuth2 / OpenID Connect (recomendado para integração corporativa)**

```ts
// LoginPage.tsx — handleSubmit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) throw new Error('Credenciais inválidas')
    const { token } = await res.json()
    sessionStorage.setItem('token', token)
    onLogin()
  } catch {
    setError('Usuário ou senha incorretos')
  }
}
```

**Opção B — Integração com Firebase Auth (já há dependência do Firebase)**

```ts
import { signInWithEmailAndPassword } from 'firebase/auth'
import { getFirebaseAuth } from '../../firebase/client'

const auth = getFirebaseAuth()
await signInWithEmailAndPassword(auth, username, password)
onLogin()
```

**Arquivo a editar:** `src/components/auth/LoginPage.tsx` — apenas a função `handleSubmit`.

---

## 7. Envio ao SAP — O que mudar

### Estado atual (POC)
O botão "Enviar para SAP" em `src/components/aggregator/AggregatedView.tsx` **apenas monta o payload e exibe em um modal**. Não há chamada HTTP real.

### Para produção

Localizar a função `handleSap` em `AggregatedView.tsx` e adicionar a chamada real **após** montar o payload:

```ts
const handleSap = async (group: AggregatedCouponGroup, e: React.MouseEvent) => {
  e.stopPropagation()
  const payload: SapPayload = { ... } // construção atual — manter

  // ADICIONAR: envio real para o SAP (via BTP, RFC ou middleware)
  try {
    const res = await fetch(`${BASE_URL}/sap/conciliacao`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('SAP retornou erro')
  } catch {
    // tratar erro — exibir snackbar de falha
  }

  setSapPayload(payload) // mantém o modal de confirmação
}
```

---

## 8. Variáveis de Ambiente

| Variável                    | Obrigatória | Descrição |
|-----------------------------|-------------|-----------|
| `VITE_DATA_SOURCE`          | Sim         | `mock` (padrão), `firebase` ou `api` |
| `VITE_API_BASE_URL`         | Para `api`  | URL base da API REST/GraphQL |
| `VITE_FIREBASE_API_KEY`     | Para `firebase` | Chave da API do Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Para `firebase` | Ex: `projeto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID`  | Para `firebase` | ID do projeto no Firebase Console |
| `VITE_FIREBASE_APP_ID`      | Para `firebase` | ID do app no Firebase Console |

> **Segurança:** Variáveis com prefixo `VITE_` são embutidas no bundle e ficam visíveis no browser. Nunca coloque segredos (chaves privadas, senhas de banco) nelas. Use-as apenas para URLs e chaves públicas de SDKs de terceiros.

### Arquivos `.env`

```
.env                  → valores padrão (todos os ambientes)
.env.development      → sobrescreve para npm run dev
.env.production       → sobrescreve para npm run build
.env.local            → ignorado pelo Git, para segredos locais
```

---

## 9. Build e Deploy

### Desenvolvimento local

```bash
cd NPos
npm install
npm run dev         # http://localhost:5174/NPos/
```

### Build de produção

```bash
npm run build       # gera dist/
npm run preview     # serve o build localmente para testar
```

### GitHub Pages (atual)

Deploy automático via **GitHub Actions** (`.github/workflows/deploy.yml`) a cada push na branch `main`.

URL publicada: `https://edilsonbit.github.io/NPos/`

> **Atenção:** O `vite.config.ts` tem `base: '/NPos/'` configurado para funcionar no subpath do GitHub Pages. Para deploy em domínio próprio (raiz), mudar para `base: '/'`.

### Deploy em servidor corporativo

```bash
npm run build
# Copiar conteúdo de dist/ para o servidor web (Apache/Nginx/IIS)
# Configurar o servidor para servir index.html para todas as rotas (SPA)
```

**Configuração Nginx (exemplo):**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 10. Regenerar Dados de Mock

O arquivo `src/data/mocks/coupons.mock.json` é gerado pelo script:

```bash
node src/data/mocks/generateMock.mjs
```

### Parâmetros configuráveis no script

| Parâmetro          | Localização              | Valor atual | Descrição |
|--------------------|--------------------------|-------------|-----------|
| `dates`            | array `dates`            | 3 dias      | Período de dados |
| NFs por slot       | `for (let nfIdx = 0; nfIdx < 4` | 4 | NFs por combinação loja+data+pagamento |
| Produtos por NF    | `numProducts`            | 2 ou 3      | Mín. 2, máx. 3 |
| Formas de pagamento | `paymentMethods`        | 4           | PIX, Crédito, Débito, Dinheiro |
| Lojas              | `storeConfig`            | 5 lojas     | LJ001 a LJ110 |

---

## 11. Dependências Principais

| Pacote                  | Versão    | Finalidade |
|-------------------------|-----------|------------|
| react                   | 19.2.6    | Framework UI |
| typescript              | ~6.0.2    | Tipagem estática |
| vite                    | 8.0.12    | Bundler + dev server |
| @mui/material           | v9        | Componentes UI |
| @mui/x-date-pickers     | latest    | DatePicker |
| dayjs                   | 1.11.20   | Manipulação de datas |
| firebase                | 12.13.0   | Opcional — Firestore |

---

## 12. Pontos de Atenção para Produção

1. **Autenticação real** — O login atual não valida nada. Ver seção 6.
2. **Filtros no servidor** — Hoje os filtros são feitos no front (em memória). Com grande volume de dados, os filtros devem ser feitos via query params na API.
3. **Paginação via API** — A tabela tem paginação client-side. Para volumes reais, usar paginação server-side (offset/cursor).
4. **Persistência do agrupamento** — Hoje o agrupamento é calculado no front e vive em memória (`useState`). Em produção, o backend deve persistir os grupos e o front apenas consultá-los.
5. **Integração SAP real** — Ver seção 7. O envio atual é apenas visual.
6. **Variáveis de ambiente** — Nunca commitar `.env.local` ou `.env.production` com segredos. Usar Secrets do GitHub Actions ou cofre de credenciais do servidor.
7. **`base` do Vite** — Mudar `base: '/NPos/'` para `base: '/'` se o deploy for na raiz de um domínio próprio.
8. **CORS** — A API real deve liberar o domínio do front nos headers `Access-Control-Allow-Origin`.
