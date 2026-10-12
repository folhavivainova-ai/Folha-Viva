# LIVRO RAIZ DE EXECUÇÃO
Registro cronológico obrigatório de engenharia da Plataforma de Monitoramento Agrícola Inteligente.

---

## Registro de Execução: V00-V03 & Fundação Técnica Inicial
- **Nome Oficial da Aplicação:** Folha Viva (definido pelo titular)
- **ID da execução:** V00-V03-FUNDACAO-INICIAL
- **Data e responsável técnico:** 27/09/2026 - Engenharia AI Studio
- **Objetivo:** Implementar a estrutura inicial canônica sem dados fictícios, abrangendo o modelo de dados completo (Supabase PostGIS), contratos de domínio TypeScript, sistema de persistência offline-first local, design system do cafeeiro, onboarding passo a passo sem login, mapa aberto com camadas e suporte a talhões.
- **Arquivos/migrações alterados:**
  - `/supabase/migrations/20260920000000_v01_initial_canonical_schema.sql`
  - `/src/domain/entities.ts`
  - `/src/offline/store.ts`
  - `/src/services/weatherProvider.ts`
  - `/src/services/satelliteProvider.ts`
  - `/src/components/ui/*`
  - `/src/features/onboarding/*`
  - `/src/features/map/*`
  - `/src/features/dashboard/*`
  - `/docs/MANUAL_MESTRE.md`
  - `/docs/LIVRO_RAIZ.md`
- **Backend:**
  - Modelagem PostGIS canônica (12 tabelas) com UUIDs, RLS preparado para `owner_subject`, índices espaciais GIST e tabelas append-only para eventos e auditoria.
  - Abstração de contratos para satélite (Sentinel-2/1) e clima aberto (Open-Meteo).
- **Frontend:**
  - Experiência dupla: "Minha lavoura hoje" (mobile simples leigo) e "Painel técnico" (desktop auditável).
  - Onboarding canônico do Apêndice I sem tela de login visível.
  - Design system oficial com cores e tipografia de alto contraste.
  - Mapa interativo livre com camadas de satélite, relevo e ruas sem dependência de chaves pagas do Google.
  - Zero dados fictícios: estados vazios informativos e receptivos à entrada real do produtor.
- **Testes executados:**
  - Typecheck com compilação TypeScript limpa.
  - Verificação de fluxo sem login, persistência no dispositivo e reconexão.
- **Homologação (retificada em 11/10/2026):** Declaração anterior revogada. Fundação local parcial, sem evidência vertical suficiente.
- **Desvios do manual (retificados):** Identidade apenas local, sem envio ao banco, sem service worker e com divergência entre migrações. O registro original não comprova os testes declarados.
- **Pendências:** Integração de API de satélite real em produção e sincronização de fundo com Supabase remoto quando configurado pelo cliente.
- **Evidências:** As afirmações históricas acima não são homologação. Ver auditoria anterior e registro de retomada abaixo.

## Retomada V01-E03/E04 e V02-E01 — 11/10/2026

- Base recuperada: GitHub main f23a362eca1ed9ca116875a80fc9339cf39af236. A tentativa anterior foi interrompida antes de instalar dependências e não publicou as alterações; recuperadas as duas migrações conciliadas com o histórico do Supabase.
- Retificação V00-E02/E03/E05: checklist vertical, identificação do Markdown como resumo do PDF, retirada da homologação prematura e diagnóstico consumindo documentos versionados.
- Banco: owner_subject vinculado a auth.users, políticas RLS por dono e relacionamentos, índices, validação PostGIS, RPC invoker com recibo idempotente atômico e bloqueio da função rls_auto_enable. Migrações locais correspondem aos identificadores efetivamente aplicados pelo conector. Revogações em objetos PostGIS de supabase_admin não surtiram efeito com a conexão postgres; ver pendência abaixo.
- Cliente: configuração pública validada, segredos exclusivos do servidor, providers de mapa/clima/satélite desacoplados. Integrações ausentes permitem cadastro local. Clima sem valores fabricados e com cache por localização; correção de transparência, sem homologar V05.
- V02-E01: sessão anônima silenciosa implementada; perda/troca de sessão preserva dados e bloqueia transferência silenciosa. Identificador local não é credencial.
- V14-E01/E02/E06: IndexedDB com estado/outbox transacionais, importação do legado sem apagar os originais, produtor/ciclo corretamente enfileirados, reconexão, backoff e confirmação por recibo. Shell offline no build; mapas externos não são cacheados.
- V19-E01: contrato de vínculo futuro preservando auth.uid(); recuperação e conversão para conta definitiva permanecem futuras.
- Arquivos: src/config, src/domain/sync.ts, src/offline/store.ts, src/services, App e componentes de cadastro/status/diagnóstico, scripts/build-shell.mjs, supabase/config.toml, migrations/tests, lockfile e docs.
- Evidências automatizadas: 15 testes passaram (persistência/reinício/importação, perda de sessão, geometria, configuração, reconexão/erro/concorrência e ausência de clima fabricado); TypeScript e build passaram. Script lint herdado equivale a typecheck, não ESLint.
- Evidências SQL: supabase/tests/identity_sync.sql executado no banco remoto com rollback; repetição sem duplicação, rejeição de payload alterado, SRID 4326, leitura e escrita cruzadas negadas. Nenhum dado de teste persistido.
- Limites: Auth remoto tem anonymous_users=false. O titular escolheu deixar a homologação remota pendente. Recriação limpa do banco, PWA instalada em celular, persistência de sessão real entre reaberturas e fluxo integrado em dois dispositivos ainda pendentes.
- Pendência de segurança verificada: PostGIS preexistente em public pertence a supabase_admin; postgres não pode assumir esse papel. spatial_ref_sys permanece acessível e três st_estimatedextent continuam executáveis. Resolver com suporte/permissão administrativa ou migração planejada da extensão para schema não exposto antes de homologar V01-E03. As tabelas de cadastro testadas têm isolamento por RLS. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
- Status: implementação para validação; V01-E03/E04 e V02-E01 não homologados verticalmente. V02-E02 continua parcial. Não avançar para V04; próximo marco é homologar esta base e completar V02/V03.
- Navegador: cadastro local realizado sem GPS/login, reabertura preservou os registros e duas mutações pendentes; viewport 390×844 sem overflow horizontal. Evidência em docs/evidencias/cadastro-local-mobile.jpg. Nenhum registro de validação local foi enviado ao banco.
- Shell offline: reload após desligar o preview 4173 manteve a aplicação e registros locais. Console sem erros de aplicação no teste final. Ver docs/VERIFICACAO_RETOMADA.md. Continua pendente a instalação e reabertura em celular real.
