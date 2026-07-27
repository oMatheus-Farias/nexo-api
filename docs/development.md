# Desenvolvimento

## Pre-requisitos

- Node.js: versao nao identificada no repositorio; os scripts usam recursos modernos do Node, entao a versao deve ser conferida antes de alterar o ambiente.
- pnpm 10.30.1.
- PostgreSQL para execucao local.
- Variaveis de ambiente definidas em `.env` com base em `.env.example`.

## Variaveis de ambiente

- `PORT`: porta do servidor.
- `DATABASE_URL`: string de conexao com o banco PostgreSQL.
- `JWT_SECRET`: chave usada pelo JWT e pela criptografia do cookie de acesso.
- `FRONTEND_URL`: base URL do frontend para redirecionamentos.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`: OAuth do Google.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`: OAuth do GitHub.
- `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`: GitHub App.
- `OPENAI_API_KEY`, `OPENAI_MODEL`: integracao com OpenAI.

## Instalacao

- Comando confirmado pelo gerenciador configurado: `pnpm install`.
- O `postinstall` executa `prisma generate` automaticamente.

## Execucao local

- Desenvolvimento: `pnpm dev`.
- Build: `pnpm build`.
- Start do build: `pnpm start`.
- Type-check: `pnpm typecheck`.

## Banco de dados

- O schema fica em `prisma/schema.prisma`.
- As migrations ja versionadas ficam em `prisma/migrations/`.
- Nao foi identificado script padrao de migration no `package.json`.
- O ambiente local de PostgreSQL esta em `docker-compose.yml`.

## Qualidade de codigo

- Formatar e lintar arquivos staged: o hook de pre-commit executa `npx lint-staged`.
- `lint-staged` roda `npx prettier --write` e `npx eslint --no-warn-ignored` para `*.ts`, `*.tsx`, `*.json`, `*.yaml`, `*.yml` e `*.md`.
- Convencao de commits: commitlint com padrao conventional commits, validado no hook `commit-msg`.
- Nao foi identificado script repo-wide de lint, formatacao ou testes automatizados.

## Estrutura e padroes

- A aplicacao usa controllers + use cases + repositories/queries + gateways.
- Controllers com schema usam o decorator `@Schema` e Zod.
- Dependencias sao resolvidas por `Registry` + `@Injectable`.
- Rotas privadas usam `ensureAuthenticated`.
- Erros sao normalizados em `src/main/app.ts`.
- Codigo novo deve manter tipagem forte e evitar `any` quando houver alternativa tipada.

## Containers e servicos auxiliares

- `docker-compose.yml` define um container PostgreSQL local.
- Nao foi identificado outro servico auxiliar, como Redis, fila ou worker.

## Debugging

- Health check: `GET /`.
- Status tecnico: `GET /status`.
- Swagger/Scalar: `GET /docs`.
- O servidor registra no console a URL local e a URL da documentacao.

## Estrategia de teste

- Nao foi identificado suite de testes automatizados.
- Para tarefas de comportamento, valide pelo menos `pnpm typecheck` e `pnpm build` quando aplicavel.
- Para fluxos HTTP, valide manualmente os endpoints afetados e atualize a documentacao correspondente.

## Checklist antes de concluir uma tarefa

- Confirmar impacto em arquivos relacionados.
- Revisar diff completo.
- Validar com `pnpm typecheck` e, se aplicavel, `pnpm build`.
- Executar validacao manual de endpoints ou fluxo quando a mudanca tocar HTTP, auth, banco ou integracao externa.
- Confirmar que a documentacao afetada foi atualizada no mesmo conjunto de alteracoes.
- Registrar pendencias quando algo nao puder ser validado.

## Solucao de problemas conhecidos

- Se `env` falhar na inicializacao, verifique se todas as variaveis obrigatorias foram definidas.
- Se o Prisma Client faltar, rode a instalacao para disparar o `postinstall`.
- Se a autenticacao falhar, confira `JWT_SECRET`, cookies e a desencriptacao do `nexo-access-token`.
- Se relatorios falharem, confira `GITHUB_APP_PRIVATE_KEY`, `OPENAI_API_KEY` e `OPENAI_MODEL`.

## Quando atualizar este documento

Atualize este documento quando comandos, ferramentas, padroes, dependencias ou processos mudarem.
