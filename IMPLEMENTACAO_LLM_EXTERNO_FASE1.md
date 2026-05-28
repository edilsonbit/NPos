# Implementacao LLM Externo - Fase 1

## Objetivo
Evoluir o assistente atual para linguagem mais humana usando LLM externo, mantendo as respostas estritamente baseadas em dados internos do OmniPOS, com controle de acesso, evidencias e auditoria.

## Principios da Fase 1
- LLM nao e fonte de verdade.
- LLM nao faz busca direta na internet.
- Somente dados internos permitidos por perfil entram no contexto do LLM.
- Toda resposta deve ter evidencias internas rastreaveis.
- Se nao houver contexto suficiente, responder insuficiente_context.

## Estado Atual (base existente)
- API Firebase Functions central em functions/src/index.ts.
- Rotas atuais para dados operacionais:
  - GET /cupons
  - GET /agregacao
- Assistente atual no frontend em src/application/embeddedAiService.ts, com regras deterministicas locais.

## Arquitetura Alvo - Fase 1

### Fluxo
1. Frontend envia pergunta para endpoint interno do assistente.
2. Backend identifica intencao e entidades (data, loja, cupom, periodo).
3. Backend executa consultas internas (Firestore e/ou repositorios internos).
4. Backend aplica RBAC e remove campos nao permitidos.
5. Backend monta contexto com evidencias internas.
6. Backend chama LLM externo somente para redacao da resposta.
7. Backend valida resposta e retorna payload estruturado com evidencias.
8. Backend grava auditoria completa da consulta.

### Componentes novos
- Backend (functions):
  - functions/src/routes/assistant.ts
  - functions/src/services/assistantOrchestrator.ts
  - functions/src/services/assistantRetrieval.ts
  - functions/src/services/assistantPolicy.ts
  - functions/src/services/assistantLlmClient.ts
  - functions/src/services/assistantAudit.ts
  - functions/src/domain/assistantModels.ts
- Frontend (app):
  - src/application/embeddedAiService.ts passa a chamar endpoint backend /assistant/query
  - manter estrutura de resposta existente para preservar UI da modal

## Contrato de API proposto

### POST /assistant/query
Request:
- prompt: string
- userEmail: string
- sessionId: string opcional
- locale: string opcional

Response:
- requestId: string
- generatedAt: string ISO
- queryType: string
- status: ok | insufficient_context | forbidden | error
- answer: string
- evidence: array de itens
  - source: coupons | activityLogs | aggregation | docs
  - recordId: string
  - snippet: string
- warnings: string[]
- profile: operador | analista | administrador
- metadata:
  - model: string
  - latencyMs: number
  - retrievedCount: number
  - confidence: low | medium | high

## Politica de seguranca

### RBAC
- operador:
  - pode consultar cupons e agregacao agregada
  - nao pode ver logs sensiveis
- analista:
  - pode consultar cupons, agregacao e resumo de logs
- administrador:
  - acesso total definido por policy interna

### Hardening
- bloquear chamadas de ferramentas externas no cliente LLM.
- nao enviar PII desnecessaria no prompt.
- mascarar dados sensiveis quando aplicavel.
- timeout de chamada LLM com fallback deterministico.
- limite de tokens e truncamento de contexto por prioridade.

## Prompt Policy (sistema)
- Voce responde apenas com base no CONTEXTO_INTERNO fornecido.
- Nao use conhecimento externo para fatos do portal.
- Nao invente dados.
- Se contexto insuficiente, retorne status insufficent_context com orientacao objetiva.
- Sempre citar evidencias utilizadas (source e recordId).

Observacao: na implementacao usar a string correta insufficient_context para manter compatibilidade com o frontend.

## Estrategia de retrieval na Fase 1
- Sem vetor inicialmente (mais rapido para entrega).
- Retrieval hibrido:
  - consultas deterministicas por intencao para cupons e agregacao
  - resumo de logs por janela temporal
- Ordenacao por relevancia simples:
  - prioridade por correspondencia exata de entidades
  - depois recencia
  - limite MAX_EVIDENCE_ITEMS

## Auditoria obrigatoria
Salvar em colecao activityLogs (ou colecao dedicada assistantLogs):
- requestId
- userId/userEmail
- prompt original
- queryType inferido
- filtros aplicados
- ids recuperados
- status final
- tempo total
- modelo utilizado
- custo estimado (se disponivel)
- erros

## Provedor LLM recomendado
Opcao principal:
- Azure OpenAI com private networking e segredo em Secret Manager.

Config minima:
- ASSISTANT_LLM_PROVIDER=azure-openai
- ASSISTANT_LLM_MODEL=gpt-4.1-mini (ou equivalente aprovado)
- ASSISTANT_LLM_ENDPOINT
- ASSISTANT_LLM_API_KEY (secret)
- ASSISTANT_LLM_TIMEOUT_MS=10000

## Plano de implementacao (2 sprints)

### Sprint 1
- Criar endpoint /assistant/query.
- Implementar orchestrator com policy + retrieval deterministico.
- Implementar cliente LLM com timeout e retry curto.
- Retornar mesmo formato de EmbeddedAiResponse atual.
- Logar auditoria minima.

### Sprint 2
- Adicionar avaliacoes automatizadas de qualidade.
- Adicionar guardrail de groundedness (resposta so com evidencias recuperadas).
- Melhorar classificacao de intencoes multiplas.
- Incluir fallback completo para motor local em caso de indisponibilidade do LLM.

## Criterios de aceite Fase 1
- Fluxo ponta a ponta UI -> API assistente -> resposta com evidencias.
- Nenhuma resposta de fato operacional sem evidencia interna.
- RBAC aplicado por perfil antes da chamada ao LLM.
- Auditoria completa de cada consulta.
- Fallback funcional quando LLM indisponivel.

## Riscos e mitigacoes
- Alucinacao de resposta:
  - mitigar com prompt estrito + validacao pos-resposta + evidencias obrigatorias.
- Custo e latencia:
  - cache por pergunta normalizada e timeout com fallback.
- Exposicao de dados:
  - policy de campos permitidos e mascaramento antes do contexto.

## Proximo passo tecnico recomendado
1. Implementar functions/src/routes/assistant.ts e registrar no app em functions/src/index.ts.
2. Mover a logica de intencao atual do frontend para backend como fallback deterministico.
3. Trocar src/application/embeddedAiService.ts para chamar o endpoint backend.
4. Validar com 30 perguntas reais do time operacional.
