# Integracoes

## Visao geral

As integracoes confirmadas neste repositorio sao:

- Google OAuth 2.0 para autenticacao de usuarios.
- GitHub OAuth 2.0 para autenticacao e obtencao de email.
- GitHub App para leitura de instalacoes, repositorios e atividades.
- OpenAI Responses API para geracao do resumo textual do relatorio.
- PostgreSQL como dependencia de persistencia via Prisma.
- Frontend consumidor via redirecionamentos para `FRONTEND_URL`.

## Google OAuth

- Finalidade: autenticar o usuario e criar ou vincular a conta local.
- Fluxo: `POST /auth/google` retorna URL de autorizacao; `GET /auth/google/callback` troca `code` por token e busca dados do perfil.
- Direcao do fluxo: backend -> Google OAuth endpoints.
- Modulo responsavel: `src/application/usecases/auth/GoogleOAuthUseCase.ts` e `src/application/usecases/auth/GoogleCallbackUseCase.ts`.
- Autenticacao: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.
- Endpoints externos: `https://accounts.google.com/o/oauth2/v2/auth`, `https://oauth2.googleapis.com/token`, `https://www.googleapis.com/oauth2/v2/userinfo`.
- Tratamento de erro: falha na troca do code ou na consulta do perfil gera `NotFound`; code ausente gera `Unauthorized`.
- Idempotencia: o callback vincula por Google ID e por email, evitando duplicacao quando possivel.
- Arquivos relacionados: `src/application/controllers/auth/GoogleOAuthController.ts`, `src/application/controllers/auth/GoogleCallbackController.ts`.

## GitHub OAuth

- Finalidade: autenticar o usuario e obter email/perfil para vincular a conta local.
- Fluxo: `POST /auth/github` retorna URL de autorizacao; `GET /auth/github/callback` troca `code` por token e busca dados do perfil.
- Direcao do fluxo: backend -> GitHub OAuth endpoints.
- Modulo responsavel: `src/application/usecases/auth/GithubOAuthUseCase.ts` e `src/application/usecases/auth/GithubCallbackUseCase.ts`.
- Autenticacao: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`.
- Endpoints externos: `https://github.com/login/oauth/authorize`, `https://github.com/login/oauth/access_token`, `https://api.github.com/user`, `https://api.github.com/user/emails`.
- Tratamento de erro: code ausente gera `Unauthorized`; falha no token ou no perfil gera `NotFound`; erro retornado pelo GitHub OAuth gera `Unauthorized`.
- Arquivos relacionados: `src/application/controllers/auth/GithubOAuthController.ts`, `src/application/controllers/auth/GithubCallbackController.ts`.

## GitHub App

- Finalidade: identificar instalacoes, sincronizar repositorios e coletar atividades para relatorios.
- Fluxo: callback de instalacao em `GET /github/app/callback`, sincronizacao manual em `POST /repositories/sync`, listagem em `GET /repositories/paginated`, coleta de atividades durante a geracao do relatorio.
- Direcao do fluxo: backend -> GitHub App REST API.
- Modulo responsavel: `src/infra/gateways/github/GithubAppGateway.ts`.
- Autenticacao: `GITHUB_APP_ID` e `GITHUB_APP_PRIVATE_KEY` base64, decodificada para uso pelo SDK da `@octokit/app`.
- Clientes/endpoints usados: `GET /installation/repositories`, `GET /repos/{owner}/{repo}/commits`, `GET /repos/{owner}/{repo}/pulls`, `GET /repos/{owner}/{repo}/issues`, `GET /app/installations/{installation_id}`.
- Eventos/payloads relevantes: `installation_id` e `setup_action` no callback; repositorios, commits, pull requests e issues retornados pelo GitHub.
- Tratamento de erro: quando a instalacao nao resolve um account valido, o gateway lança `Conflict`.
- Idempotencia: `PrismaIntegrationRepository.createOrUpdate` atualiza a integracao GitHub existente em vez de criar duplicata; a sincronizacao dos repositorios usa `upsert` por `integrationId` e `externalRepoId`.
- Limites: paginação manual em blocos de 100 itens; coleta de atividades truncada por `maxItemsPerType`.
- Arquivos relacionados: `src/application/usecases/auth/GithubAppInstallCallbackUseCase.ts`, `src/application/usecases/github/ListGithubRepositoriesUseCase.ts`, `src/application/usecases/reports/GenerateGithubRepositoryReportUseCase.ts`.

## OpenAI Responses API

- Finalidade: gerar o resumo textual do relatorio de repositorio.
- Direcao do fluxo: backend -> OpenAI API.
- Modulo responsavel: `src/infra/gateways/openai/OpenAiGateway.ts`.
- Autenticacao: `OPENAI_API_KEY`.
- Configuracao: `OPENAI_MODEL` com padrao `gpt-4.1-mini` quando nao definido.
- Estrutura relevante: o gateway envia um payload compacto com periodo, metricas e digest de atividades.
- Tratamento de erro: ausencia de API key impede a construcao do gateway; resposta sem JSON valido gera `BadRequest`.
- Idempotencia: nao ha garantia explitica; o resultado depende do prompt e do digest.
- Riscos: a funcionalidade de relatorio depende da disponibilidade da API e do modelo configurado.
- Arquivos relacionados: `src/application/usecases/reports/GenerateGithubRepositoryReportUseCase.ts`.

## PostgreSQL via Prisma

- Finalidade: armazenar usuarios, refresh tokens, integracoes, repositorios, relatorios, itens de relatorio e logs de uso.
- Direcao do fluxo: backend -> Prisma Client -> PostgreSQL.
- Modulo responsavel: `src/infra/clients/prismaClient.ts` e `prisma/schema.prisma`.
- Configuracao: `DATABASE_URL`.
- Observacao: o Prisma Client e gerado em `src/infra/prisma/generated/prisma`.
- Tratamento de erro: o status tecnico faz queries diretas para medir versao e conexoes.
- Arquivos relacionados: `src/main/routes/statusRoute.ts`, `src/infra/database/prisma/**`.

## Frontend consumidor

- Finalidade: receber redirecionamentos pos-login e pos-instalação do GitHub App.
- Direcao do fluxo: backend -> frontend.
- Configuracao: `FRONTEND_URL`.
- Uso confirmado: redirecionamentos em callbacks de Google, GitHub e GitHub App.
- Tratamento de erro: callbacks do GitHub App redirecionam com query string de status.
- Arquivos relacionados: `src/application/controllers/auth/GoogleCallbackController.ts`, `src/application/controllers/auth/GithubCallbackController.ts`, `src/application/controllers/auth/GithubAppCallbackController.ts`.

## Integracoes nao identificadas

- Nao foram identificadas filas, workers, schedulers, cache distribuido ou provedores de armazenamento de arquivos.
- Nao foi identificado webhook handler para eventos do GitHub App alem do callback de instalacao.
- Nao foram identificadas integracoes externas adicionais alem das listadas acima.

## Quando atualizar este documento

Atualize este documento quando houver mudancas em:

- contratos;
- autenticacao;
- clientes;
- payloads;
- eventos;
- variaveis de ambiente;
- estrategias de erro;
- timeouts;
- retries;
- idempotencia.
