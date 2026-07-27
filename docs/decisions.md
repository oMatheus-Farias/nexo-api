# Decisoes arquiteturais

## ADR-001 - Backend Fastify com arquitetura em camadas

- Status: Aceita
- Data: Nao identificada
- Contexto: o projeto precisa expor rotas HTTP, aplicar validacao de entrada, integrar banco e servicos externos e manter a camada web desacoplada da persistencia.
- Decisao: organizar o backend em `main`, `application`, `domain`, `infra`, `shared` e `kermel`, com Fastify na borda e controllers/use cases no centro.
- Motivo: a estrutura atual separa responsabilidades e facilita evolucao por modulo.
- Consequencias: controllers ficam finos; use cases concentram regras; infra pode ser substituida com menor impacto.
- Alternativas identificadas: monolito sem separacao de camadas; framework com MVC tradicional.
- Evidencias: `src/main/app.ts`, `src/application/**`, `src/infra/**`, `src/kermel/**`.
- Arquivos relacionados: `src/main/app.ts`, `src/application/adapters/fastifyAdapter.ts`, `src/domain/contracts/Controller.ts`.

## ADR-002 - Prisma com PostgreSQL como camada principal de persistencia

- Status: Aceita
- Data: Nao identificada
- Contexto: o sistema precisa persistir usuarios, integracoes, repositorios, relatorios e uso de IA.
- Decisao: usar PostgreSQL com Prisma Client gerado em `src/infra/prisma/generated/prisma`.
- Motivo: o schema e as migrations estao versionados e o acesso esta centralizado em repositories e queries.
- Consequencias: consultas e transacoes ficam tipadas; o schema do banco passa a ser fonte central para o modelo de dados.
- Alternativas identificadas: acesso SQL manual ou outro ORM.
- Evidencias: `prisma/schema.prisma`, `src/infra/clients/prismaClient.ts`.
- Arquivos relacionados: `prisma/schema.prisma`, `prisma/migrations/**`, `src/infra/database/prisma/**`.

## ADR-003 - Sessao baseada em JWT + refresh token persistido

- Status: Aceita
- Data: Nao identificada
- Contexto: o sistema precisa suportar login por OAuth e manutencao de sessao apos o callback.
- Decisao: emitir JWT de acesso, armazenar refresh tokens no banco e manter o access token em cookie HTTP-only criptografado.
- Motivo: o fluxo atual separa validade curta do JWT e renovacao por refresh token revogavel.
- Consequencias: sign out e revogacao podem remover todos os refresh tokens do usuario; a autenticacao depende de cookie + JWT.
- Alternativas identificadas: sessao totalmente stateful ou JWT sem refresh token.
- Evidencias: `src/main/middlewares/ensureAuthenticated.ts`, `src/application/usecases/auth/RefreshTokenUseCase.ts`, `src/application/controllers/auth/*`.
- Arquivos relacionados: `src/infra/database/prisma/repositories/RefreshTokenRepository.ts`, `src/shared/utils/Encryption.ts`, `src/infra/gateways/JwtTokenGateway.ts`.

## ADR-004 - Google e GitHub como provedores OAuth de entrada

- Status: Aceita
- Data: Nao identificada
- Contexto: o usuario precisa entrar com provedores sociais e vincular a conta local.
- Decisao: suportar autenticao via Google OAuth e GitHub OAuth, vinculando por id externo e, quando necessario, por email.
- Motivo: reduz friccao de cadastro e facilita associacao de contas existentes.
- Consequencias: o sistema precisa tratar callback, troca de code, obtencao de perfil e conciliacao de contas.
- Alternativas identificadas: autenticacao local por senha; SSO unico.
- Evidencias: `src/application/usecases/auth/GoogleCallbackUseCase.ts`, `src/application/usecases/auth/GithubCallbackUseCase.ts`.
- Arquivos relacionados: `src/application/controllers/auth/GoogleOAuthController.ts`, `src/application/controllers/auth/GithubOAuthController.ts`.

## ADR-005 - GitHub App como fonte de dados de atividade de repositorio

- Status: Aceita
- Data: Nao identificada
- Contexto: o relatorio depende de commits, pull requests, issues e instalacao autorizada no repositorio GitHub.
- Decisao: usar GitHub App para ler repositorios e atividades, em vez de depender apenas do OAuth de usuario.
- Motivo: a instalacao do app da acesso ao conjunto de repositorios autorizado e permite coleta estruturada de atividade.
- Consequencias: a integracao GitHub precisa armazenar `installationId`; o relatorio depende dessa instalacao existir.
- Alternativas identificadas: uso apenas da API de usuario; webhooks como fonte principal.
- Evidencias: `src/application/usecases/auth/GithubAppInstallCallbackUseCase.ts`, `src/application/usecases/github/ListGithubRepositoriesUseCase.ts`, `src/application/usecases/reports/GenerateGithubRepositoryReportUseCase.ts`.
- Arquivos relacionados: `src/infra/gateways/github/GithubAppGateway.ts`, `prisma/schema.prisma`.

## ADR-006 - OpenAI para gerar o resumo textual do relatorio

- Status: Aceita
- Data: Nao identificada
- Contexto: o sistema precisa transformar a atividade coletada em um texto curto e estruturado.
- Decisao: enviar um digest compacto de metadados/atividades ao OpenAI e exigir resposta JSON com `summary_text`.
- Motivo: a IA gera a narrativa do relatorio sem expor o backend a um prompt livre e sem depender de texto nao estruturado.
- Consequencias: a funcionalidade de relatorio depende do provedor externo e do modelo configurado.
- Alternativas identificadas: sumarizacao local deterministica; armazenar apenas metricas brutas.
- Evidencias: `src/infra/gateways/openai/OpenAiGateway.ts`, `src/application/usecases/reports/GenerateGithubRepositoryReportUseCase.ts`.
- Arquivos relacionados: `src/infra/gateways/openai/OpenAiGateway.ts`, `src/infra/database/prisma/repositories/PrismaReportRepository.ts`.

## ADR-007 - Registry proprio para injecao de dependencias

- Status: Aceita
- Data: Nao identificada
- Contexto: os controllers, use cases e gateways precisam ser instanciados com suas dependencias sem um container externo pesado.
- Decisao: usar decorators `@Injectable` e um `Registry` simples baseado em metadata de construtor.
- Motivo: a solucao atual reduz acoplamento com frameworks de DI externos.
- Consequencias: classes precisam estar registradas; a resolucao depende de metadata emitida pelo TypeScript.
- Alternativas identificadas: instanciacao manual; container DI de terceiros.
- Evidencias: `src/kermel/decorators/Injectable.ts`, `src/kermel/di/Registry.ts`.
- Arquivos relacionados: `src/application/adapters/fastifyAdapter.ts`.

## Quando atualizar este documento

Registre novas decisoes relevantes quando uma tarefa introduzir ou alterar:

- arquitetura;
- dependencias estruturais;
- banco de dados;
- autenticacao;
- integracao;
- padrao transversal;
- infraestrutura;
- estrategia de estado;
- abordagem de testes;
- convencao importante.
