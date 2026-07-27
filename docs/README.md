# Documentacao do Projeto

Pasta central da documentacao operacional do `nexo-api`.
O objetivo e permitir que o contexto do sistema seja recuperado rapidamente sem revarrer o repositorio inteiro.

## Indice

- [Arquitetura](./architecture.md): como o backend e organizado, quais sao os componentes e como eles se comunicam.
- [Regras de negocio](./business-rules.md): regras confirmadas no codigo, nos testes ou na documentacao existente.
- [Integracoes](./integrations.md): servicos externos e internos relevantes, contratos e dependencias.
- [Desenvolvimento](./development.md): setup local, comandos, padroes e checklist de validacao.
- [Decisoes arquiteturais](./decisions.md): decisoes importantes que precisam ser preservadas ao longo do tempo.

## Quando consultar

- Para entender a estrutura geral antes de alterar o sistema, consulte [Arquitetura](./architecture.md).
- Para ajustar validacoes, estados, fluxos ou permissoes, consulte [Regras de negocio](./business-rules.md).
- Para mexer em OAuth, GitHub App, OpenAI, banco ou frontend consumidor, consulte [Integracoes](./integrations.md).
- Para configurar o ambiente, executar comandos ou validar alteracoes, consulte [Desenvolvimento](./development.md).
- Para entender por que uma decisao tecnica foi adotada, consulte [Decisoes arquiteturais](./decisions.md).

## Estado revisado

- Ultima revisao consolidada: 2026-07-27.
- Base verificada: `package.json`, `tsconfig.json`, `eslint.config.ts`, `.env.example`, `docker-compose.yml`, `prisma/schema.prisma` e `src/`.

## Itens pendentes

- Nao foram identificados scripts dedicados de teste, lint repo-wide ou migration/seed padronizados.
- Nao foi identificado pipeline de CI/CD neste repositorio.
- Nao foi identificado arquivo de configuracao de runtime Node.js com versao fixa.
