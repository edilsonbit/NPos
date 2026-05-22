# NPos - OmniPOS — Conciliacao Fiscal

POC tecnica para demo executiva do cliente Boticario, com front-end em React + TypeScript + Vite + MUI e arquitetura desacoplada da fonte de dados.

## Stack

- React 19
- TypeScript 6
- Vite 8
- Material UI v9
- Firebase Firestore
- Modo mock com massa de dados local

## Funcionalidades implementadas

- **Dashboard** com KPIs e graficos (ApexCharts): total de cupons, valor total, cupons por loja/forma de pagamento/dia
- **Listagem de cupons** em tabela paginada com linha expandivel por produto
- **Filtros avancados** (busca, loja, adquirente, pagamento, status, situacao, periodo)
- **Configuracao dinamica** dos criterios de agrupamento (checkboxes com persistencia no `localStorage`)
- **Acao "Agregar Cupons"** com regra pura e testavel, persistencia do `idAgregador` no Firestore
- **Visao agrupada** com filtros, paginacao e modal de payload SAP/ERP
- **Desfazer agregacao** por grupo ou por numeros de cupom
- **Enviar grupos ao ERP** com confirmacao e feedback visual
- **Cupons Cancelados** — pagina dedicada com filtros e acao "Enviar Cancelados ao ERP"
- **Alerta das Integracoes** — log geral de todas as operacoes realizadas (agregacao, desfazer, envio ERP), com filtros, tabela e modal de detalhes
- Massa de simulacao robusta:
  - `products.mock.json` com 120 produtos
  - `coupons.mock.json` com 360+ cupons

## Arquitetura

- UI: componentes e fluxo em `src/App.tsx`
- Dominio:
  - modelos e contratos em `src/domain/models.ts`
  - interfaces de repositorio em `src/domain/repositories.ts`
  - regra de agrupamento pura em `src/domain/aggregateCoupons.ts`
- Aplicacao:
  - orquestracao de cupons em `src/application/couponService.ts`
  - log de atividades em `src/application/activityLogService.ts`
- Dados (adapters):
  - mock em `src/data/repositories/mockRepositories.ts`
  - firebase em `src/data/repositories/firebaseRepositories.ts`
  - factory de selecao em `src/data/repositories/index.ts`
- Config:
  - alternancia da origem em `src/config/appConfig.ts`

### Regra de desacoplamento

Nenhum componente visual acessa Firebase diretamente. A UI consome apenas servicos da camada de aplicacao, que usa interfaces de repositorio.


## Como executar

1. Instale dependencias:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Defina origem de dados no `.env`:

```bash
VITE_DATA_SOURCE=mock
```

Ou para Firebase:

```bash
VITE_DATA_SOURCE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

4. Rode em desenvolvimento:

```bash
npm run dev
```

## Validacao tecnica

- Build: `npm run build`
- Lint: `npm run lint`

## Observacoes da POC

- O modo `mock` e o padrao para facilitar demonstracao rapida.
- O modo `firebase` ja esta preparado para leitura/escrita de `products` e `coupons` no Firestore.
- O aviso de chunk grande no build e esperado nesta POC por causa do bundle de UI e Firebase.
- Planejamento da **IA embarcada (RAG com base local)** documentado em `GUIA_DESENVOLVIMENTO.md` (seção 14).
