# Roteiro de Apresentacao - Assistente IA OmniPOS

## Objetivo da apresentacao
Demonstrar que o assistente de IA:
- entende perguntas operacionais em linguagem natural
- responde somente com dados internos
- aplica perfil de acesso
- registra auditoria completa
- esta pronto para evoluir para LLM externo de forma segura

## O que foi entregue
- Botao do assistente no header e modal dedicada.
- Atalho global: Ctrl + Enter para abrir.
- Motor de perguntas operacionais com evidencias.
- Endpoint backend dedicado: POST /assistant/query.
- Health check do assistente: GET /assistant/health.
- Auditoria dedicada em colecao assistantLogs.
- Fallback local no frontend caso endpoint indisponivel.
- Suporte opcional para humanizacao com LLM externo.

## Fluxo de demo (10 a 12 minutos)

### 1) Abertura (1 min)
Mensagem sugerida:
"Implementamos um assistente operacional com foco em seguranca e auditabilidade. Ele responde com base apenas em dados internos do OmniPOS."

### 2) UX (1 min)
- Mostrar botao no header.
- Abrir modal pelo clique e pelo atalho Ctrl + Enter.

### 3) Perguntas operacionais (4 min)
Executar perguntas:
- "Qual loja tem mais cupons?"
- "Qual foi o cupom mais caro?"
- "Qual o faturamento total?"
- "Qual a taxa de cancelamento?"

Pontos para destacar:
- resposta direta
- evidencias de origem
- warnings quando contexto e insuficiente

### 4) Seguranca por perfil (2 min)
- Testar pergunta de logs com usuario operador.
- Mostrar retorno forbidden quando nao permitido.
- Explicar que analista/admin liberam consulta de auditoria.

### 5) Governanca (2 min)
- Chamar GET /assistant/health.
- Mostrar se LLM externo esta habilitado/configurado.
- Mostrar colecao assistantLogs no Firestore com:
  - prompt
  - status
  - queryType
  - evidencia usada
  - latencia
  - modelo usado

### 6) Encerramento (1-2 min)
Mensagem sugerida:
"Estamos prontos para fase de producao controlada. O proximo passo e acoplar LLM externo privado para melhorar linguagem, mantendo pesquisa interna e trilha de auditoria."

## Script tecnico rapido (para preparar ambiente)

### Frontend (.env)
- VITE_ASSISTANT_API_URL=http://127.0.0.1:5001/<project-id>/southamerica-east1/api/assistant/query

### Functions (functions/.env)
- ASSISTANT_ADMIN_EMAILS=...
- ASSISTANT_ANALYST_EMAILS=...
- ASSISTANT_LLM_ENABLED=false (ou true se for usar)
- ASSISTANT_LLM_ENDPOINT=...
- ASSISTANT_LLM_API_KEY=...
- ASSISTANT_LLM_MODEL=gpt-4.1-mini

### Comandos
- App: npm run dev
- Functions: cd functions ; npm run serve

## Riscos que ja estao mitigados
- Alucinacao: resposta exige contexto interno/evidencia.
- Queda do endpoint: fallback local ativo no frontend.
- Acesso indevido: bloqueio por perfil em consultas sensiveis.

## Proximos passos aprovaveis para producao
1. Adicionar suite automatizada de 50 perguntas reais com validacao de resposta.
2. Definir SLO de latencia e monitoramento por ambiente.
3. Ativar LLM privado com rede restrita e segredos gerenciados.
4. Revisao LGPD e mascaramento de campos sensiveis.
