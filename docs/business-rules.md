# Regras de negocio

Documento com regras confirmadas no codigo atual. Quando houver ambiguidade, ela fica registrada em "Pontos pendentes de confirmacao".

## Autenticacao e vinculacao de contas

### BR-001 - Login com Google vincula por Google ID, depois por email

- Descricao: no callback do Google, o sistema procura primeiro um usuario com `googleId`; se nao encontrar, procura por `email`; se nao encontrar, cria um novo usuario.
- Evidencia: `src/application/usecases/auth/GoogleCallbackUseCase.ts`.
- Condicoes: callback precisa receber `code`.
- Validacoes: `code` ausente ou invalido gera `Unauthorized`.
- Excecoes: falhas na troca do code por token ou na consulta do perfil interrompem o fluxo.
- Impacto: cria ou atualiza o usuario e gera access token + refresh token.
- Arquivos relacionados: `src/application/controllers/auth/GoogleCallbackController.ts`, `src/infra/database/prisma/repositories/UserRepository.ts`.

### BR-002 - Login com GitHub vincula por GitHub ID, depois por email

- Descricao: no callback do GitHub, o sistema procura primeiro um usuario com `githubId`; se nao encontrar, usa `email`; se nao encontrar, cria um novo usuario.
- Evidencia: `src/application/usecases/auth/GithubCallbackUseCase.ts`.
- Condicoes: callback precisa receber `code`.
- Validacoes: `code` ausente ou invalido gera `Unauthorized`.
- Excecoes: se o GitHub nao retornar email, o sistema busca em `/user/emails`.
- Impacto: cria ou atualiza o usuario e gera access token + refresh token.
- Arquivos relacionados: `src/application/controllers/auth/GithubCallbackController.ts`, `src/infra/database/prisma/repositories/UserRepository.ts`.

### BR-003 - Callback sem code nao autentica

- Descricao: os callbacks de OAuth exigem `code`.
- Evidencia: `GoogleCallbackUseCase` e `GithubCallbackUseCase`.
- Condicoes: `code` ausente, vazio ou nao string.
- Impacto: resposta de erro 401.
- Arquivos relacionados: `src/application/controllers/auth/GoogleCallbackController.ts`, `src/application/controllers/auth/GithubCallbackController.ts`.

### BR-004 - Refresh token invalido ou expirado encerra a sessao correspondente

- Descricao: o refresh token deve existir e nao pode estar expirado.
- Evidencia: `src/application/usecases/auth/RefreshTokenUseCase.ts`.
- Condicoes: token nao encontrado -> `NotFound`; token expirado -> `Unauthorized`.
- Excecoes: quando expirado, todos os refresh tokens do usuario sao removidos.
- Impacto: gera novo access token e novo refresh token.
- Arquivos relacionados: `src/application/controllers/auth/RefreshTokenController.ts`, `src/infra/database/prisma/repositories/RefreshTokenRepository.ts`.

### BR-005 - Sign out remove as sessoes do usuario

- Descricao: o sign out solicita a remocao de todos os refresh tokens do usuario.
- Evidencia: `src/application/usecases/auth/SignOutUseCase.ts`.
- Condicoes: a implementacao tenta verificar se existem sessoes ativas antes de remover.
- Observacao: a checagem atual usa a lista retornada por `findAllByUserId`; isso precisa de confirmacao porque lista vazia continua sendo um valor truthy em JavaScript.
- Impacto: remove todos os refresh tokens do usuario.
- Arquivos relacionados: `src/application/controllers/auth/SignOutController.ts`.

## Integracao GitHub App

### BR-006 - Instalar o GitHub App so associa a instalacao a usuarios ja vinculados ao GitHub

- Descricao: o callback de instalacao procura o usuario pelo `githubUserId` retornado pela API do GitHub App.
- Evidencia: `src/application/usecases/auth/GithubAppInstallCallbackUseCase.ts`.
- Condicoes: `setupAction` diferente de `install` ou `update` e ignorado.
- Excecoes: se o usuario nao estiver vinculado ao GitHub, a operacao falha com `USER_NOT_LINKED_TO_GITHUB`.
- Impacto: a integracao GitHub recebe `installationId`.
- Arquivos relacionados: `src/application/controllers/auth/GithubAppCallbackController.ts`, `src/infra/database/prisma/repositories/PrismaIntegrationRepository.ts`.

### BR-007 - A listagem de repositorios GitHub depende da instalacao do GitHub App

- Descricao: o usuario precisa ter integracao GitHub com `installationId`.
- Evidencia: `src/application/usecases/github/ListGithubRepositoriesUseCase.ts`.
- Condicoes: integracao ausente ou sem instalacao -> `NotFound`.
- Impacto: retorna os repositorios disponiveis na instalacao.
- Arquivos relacionados: `src/application/controllers/github/ListGithubRepositoriesController.ts`.

## Geracao de relatorios

### BR-008 - Relatorio GitHub exige repositorio identificado e periodo valido

- Descricao: o payload precisa informar `repository_external_id` ou `repository_full_name`, alem de `period_start` e `period_end` validos.
- Evidencia: `src/application/controllers/reports/schemas/generateGithubRepositoryReportSchema.ts` e `src/application/usecases/reports/GenerateGithubRepositoryReportUseCase.ts`.
- Condicoes: `period_start` deve ser anterior a `period_end`.
- Validacoes: periodo maximo de 120 dias.
- Excecoes: formatos invalidos geram `BadRequest`; ausencia de integracao ou repositorio gera `NotFound`.
- Impacto: o sistema busca atividades do repositorio no periodo solicitado.
- Arquivos relacionados: `src/application/controllers/reports/GenerateGithubRepositoryReportController.ts`.

### BR-009 - A quantidade de itens por tipo de atividade e limitada

- Descricao: `max_items_per_type` precisa ficar entre 50 e 300.
- Evidencia: `generateGithubRepositoryReportSchema` e `GenerateGithubRepositoryReportUseCase`.
- Condicoes: valor ausente usa padrao efetivo de 200.
- Impacto: limita o volume de commits, pull requests e issues coletados.
- Arquivos relacionados: `src/infra/gateways/github/GithubAppGateway.ts`.

### BR-010 - O estilo do relatorio tem valores fixos

- Descricao: o estilo aceito e `EXECUTIVE`, `TECHNICAL`, `SPRINT` ou `WEEKLY`.
- Evidencia: schema do controller e `OpenAiGateway`.
- Condicoes: ausencia do campo usa `EXECUTIVE`.
- Impacto: muda as instrucoes enviadas ao OpenAI.
- Arquivos relacionados: `src/infra/gateways/openai/OpenAiGateway.ts`.

### BR-011 - O resumo gerado pelo OpenAI deve ser JSON com summary_text

- Descricao: o gateway de IA espera JSON e valida `summary_text`.
- Evidencia: `src/infra/gateways/openai/OpenAiGateway.ts`.
- Condicoes: se a resposta nao for JSON valido, a operacao falha.
- Impacto: o texto salvo no relatorio vem apenas do campo validado.
- Arquivos relacionados: `src/infra/database/prisma/repositories/PrismaReportRepository.ts`.

## Seguranca e sessao

### BR-012 - Rotas privadas exigem autenticacao via JWT e cookie criptografado

- Descricao: o middleware extrai `nexo-access-token`, descriptografa e valida o JWT.
- Evidencia: `src/main/middlewares/ensureAuthenticated.ts`.
- Condicoes: falha na descriptografia ou na validacao do JWT gera `Unauthorized`.
- Impacto: protege os endpoints marcados como privados.
- Arquivos relacionados: `src/main/routes/auth/authRoutes.ts`, `src/main/routes/user/userRoutes.ts`, `src/main/routes/report/reportRoutes.ts`, `src/main/routes/github/githubRoutes.ts`.

## Pontos pendentes de confirmacao

- Nao foi identificado um fluxo formal de seeding ou reset de dados.
- Nao foi identificado um conjunto de testes cobrindo as regras acima.
- Nao foi identificado se o callback do GitHub App deve tratar outros `setup_action` alem de `install` e `update`.
- Nao foi identificado se a gravacao de strings vazias em campos opcionais de integracao e intencional.
- Nao foi confirmado se o comportamento de sign out deve bloquear usuarios sem sessoes ativas; a checagem atual nao parece efetiva.

## Quando atualizar este documento

Atualize este documento sempre que uma tarefa alterar:

- validacoes;
- permissoes;
- estados;
- condicoes;
- calculos;
- transicoes;
- comportamentos do dominio.
