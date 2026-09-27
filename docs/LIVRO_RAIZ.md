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
- **Homologação:** Aprovado para V1 inicial.
- **Desvios do manual:** Nenhum.
- **Pendências:** Integração de API de satélite real em produção e sincronização de fundo com Supabase remoto quando configurado pelo cliente.
- **Evidências:** Estrutura completa verificada em conformidade com o Manual Mestre.
