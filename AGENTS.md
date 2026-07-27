# AGENTS.md

## 1. Visao geral

- Projeto: `nexo-api`.
- Objetivo: API backend para autenticacao, integracao com Google/GitHub, vinculacao de contas GitHub App e geracao de relatorios de atividade de repositorios.
- Dominio: gestao de contas, integracoes externas e relatorios de engenharia.
- Perfis principais: usuarios autenticados, integracao via OAuth, instalacao de GitHub App e consumo do frontend configurado em `FRONTEND_URL`.
- Capacidades principais: login Google/GitHub, refresh de sessao, sign out, consulta do usuario logado, listagem de repositorios GitHub da instalacao, geracao de relatorios com OpenAI e endpoints de health/status.
- Estado atual: backend TypeScript em Fastify + Prisma, sem frontend neste repositorio e sem testes automatizados identificados.

## 2. Mapa do repositorio

- `src/main/`: bootstrap do servidor, registracao de rotas, middlewares e utilitarios HTTP.
- `src/application/`: controllers, use cases, entidades e erros da camada de aplicacao.
- `src/domain/`: contratos abstratos para controllers e repositorios.
- `src/infra/`: clientes, persistencia Prisma e gateways externos.
- `src/shared/`: configuracao, constantes e utilitarios transversais.
- `src/kermel/`: decorator e registry simples de injecao de dependencias.
- `prisma/`: schema e migrations do PostgreSQL.
- `docker-compose.yml`: ambiente local de PostgreSQL.
- `docs/`: documentacao operacional viva do projeto.

## 3. Stack principal

- Linguagem: TypeScript.
- Runtime: Node.js.
- Framework HTTP: Fastify 5.7.4.
- Persistencia: PostgreSQL com Prisma 7.9.1 e `@prisma/adapter-pg`.
- Autenticacao: `@fastify/jwt`, cookies HTTP-only e refresh tokens persistidos.
- Estado: nao ha gerenciador global de estado de frontend; no backend a sessao e resolvida por JWT + cookie + banco.
- Ferramentas principais: Zod, Swagger/Scalar, OpenAI SDK, Octokit, ESLint, Prettier, Husky, lint-staged, tsup.
- Gerenciador de pacotes: pnpm 10.30.1.

## 4. Comandos principais

- Instalacao: `pnpm install` (`packageManager` confirma pnpm; `postinstall` executa `prisma generate`).
- Desenvolvimento: `pnpm dev`.
- Build: `pnpm build`.
- Execucao local do build: `pnpm start` depois de `pnpm build`.
- Type-check: `pnpm typecheck`.
- Geracao de Prisma Client: `prisma generate` via `postinstall`.
- Lint e formatacao: nao ha scripts dedicados; o pre-commit roda `npx lint-staged`, que executa `npx prettier --write` e `npx eslint --no-warn-ignored` nos arquivos staged.
- Migrations: nao ha comando padrao explicitado em script; revisar `prisma/migrations/` e o fluxo antes de alterar o schema.
- Servicos auxiliares: PostgreSQL local em `docker-compose.yml`.

## 5. Documentacao do projeto

- [docs/README.md](docs/README.md): indice central e estado atual da documentacao.
- [docs/architecture.md](docs/architecture.md): arquitetura, componentes, entradas e fluxos tecnicos.
- [docs/business-rules.md](docs/business-rules.md): regras de negocio confirmadas e pendencias.
- [docs/integrations.md](docs/integrations.md): integracoes externas e internas relevantes.
- [docs/development.md](docs/development.md): setup, comandos, padroes e checklist de validacao.
- [docs/decisions.md](docs/decisions.md): decisoes arquiteturais e tecnicas importantes.

## 6. Diretrizes permanentes para o Codex

- Antes de iniciar qualquer tarefa, leia este `AGENTS.md`.
- Consulte somente os documentos de `docs/` relacionados a tarefa atual e nao faca nova varredura completa quando o contexto ja estiver documentado.
- Confirme no codigo apenas as areas diretamente relacionadas a tarefa; compreenda o contexto antes de modificar qualquer arquivo.
- Nunca altere codigo sem analisar impacto em modulos relacionados; nunca remova funcionalidades sem solicitacao explicita.
- Nunca faca gambiarra, patch temporario, solucao fraca ou mascara de erro; trate a causa.
- Nunca duplique logica; reutilize componentes, servicos, utilitarios e padroes existentes quando apropriado.
- Respeite a arquitetura existente, preserve baixo acoplamento e alta coesao, aplique responsabilidade unica e priorize legibilidade e manutencao.
- Mantenha tipagem forte; evite `any`, casts inseguros e supressoes de erro sem justificativa.
- Evite overengineering, abstracoes prematuras e otimizacoes sem evidencia.
- Nao introduza novas dependencias sem necessidade real e preserve compatibilidade com o restante do sistema.
- Considere seguranca, privacidade, autorizacao, exposicao de dados, concorrencia, idempotencia, performance e acessibilidade quando aplicavel.
- Preserve consistencia visual e comportamental.
- Nao altere arquivos fora do escopo sem justificativa; faca mudancas incrementais e faceis de revisar.
- Adicione ou atualize testes quando o comportamento for alterado e execute as validacoes relevantes antes de concluir.
- Nao declare validacao que nao foi executada; registre riscos, limitacoes e pontos nao validados.
- Entregue codigo completo quando solicitado; nao apresente trechos desconectados quando a alteracao exigir o arquivo completo.
- Nao suponha estrutura de arquivos nao analisada; solicite ou leia os arquivos necessarios antes de modificar uma implementacao desconhecida.

## 7. Uso obrigatorio de Skills

Antes de iniciar qualquer tarefa:

1. Identifique quais Skills sao relevantes.
2. Utilize apenas as Skills necessarias.
3. Prefira a Skill mais especializada para a atividade.
4. Combine Skills quando a tarefa envolver diferentes areas.
5. Nao utilize uma Skill apenas porque ela esta instalada.

Considere prioritariamente:

- Project Orchestrator.
- Full Stack TypeScript Architect.
- React/Next Senior Developer.
- Express API Engineer.
- Database Designer.
- Code Reviewer.
- Professional UI/UX Designer.
- UI/UX Dashboard Specialist.
- Technical Documentation Writer.

Use uma Skill mais especifica quando o contexto exigir.

## 8. Uso obrigatorio de MCPs

- Context7: use sempre que a tarefa depender de documentacao atualizada de frameworks, bibliotecas, APIs, SDKs, ORMs, build, testes ou comportamento especifico de versao; antes de implementar, confirme a biblioteca e a versao, consulte a documentacao atual e aplique somente APIs compativeis.
- Playwright: use quando houver inspecao de interface, reproducao de bug visual, validacao de fluxo, responsividade, navegacao, estados, comportamento no navegador, testes end-to-end, screenshots ou acessibilidade pratica.
- GitHub: use quando a tarefa envolver pull requests, issues, historico, branches, commits, revisao de alteracoes ou informacoes que existam apenas no repositorio remoto.

## 9. Fluxo obrigatorio de trabalho

1. Ler o `AGENTS.md`.
2. Identificar o escopo da solicitacao.
3. Consultar os documentos relevantes em `docs/`.
4. Selecionar as Skills necessarias.
5. Identificar os arquivos diretamente envolvidos.
6. Confirmar padroes existentes no codigo.
7. Consultar o Context7 quando houver dependencia de documentacao atual.
8. Planejar a alteracao.
9. Implementar a menor solucao completa e correta.
10. Validar com testes, lint, type-check, build ou Playwright, conforme aplicavel.
11. Revisar o proprio diff.
12. Verificar regressoes e efeitos colaterais.
13. Atualizar a documentacao afetada.
14. Resumir o que mudou, o que foi validado e o que permanece pendente.

## 10. Documentacao viva

- A documentacao faz parte da implementacao.
- Em toda tarefa futura, verifique impacto em arquitetura, estrutura de pastas, comandos, setup, dependencias, variaveis de ambiente, regras de negocio, integracoes, contratos, banco de dados, fluxos, decisoes arquiteturais, padroes de desenvolvimento e riscos conhecidos.
- Atualize no mesmo conjunto de alteracoes somente os documentos afetados.
- Preserve informacoes historicas relevantes em `docs/decisions.md`, corrija ou remova informacoes obsoletas e nao duplique a mesma explicacao em varios arquivos.
- Use `AGENTS.md` como indice operacional e `docs/` como fonte detalhada.
