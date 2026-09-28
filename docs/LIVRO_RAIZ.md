# LIVRO RAIZ DE EXECUÇÃO
Registro cronológico obrigatório de engenharia da Plataforma de Monitoramento Agrícola Inteligente — Folha Viva.

---

## Registro de Execução: V00-V01-CPF-AUTH-FIREBASE
- **ID da execução:** V00-V01-CPF-AUTH-FIREBASE
- **Data e responsável técnico:** 27/09/2026 - Engenharia AI Studio
- **Objetivo:** Implementação completa dos Módulos 00 e 01 do Manual Mestre, com substituição integral de referências e dependências legado por Firebase Firestore (`ai-studio-folhaviva-bcbe6de4-6fb7-4087-8be0-5a49bfd455f9`). Introdução da primeira tela com escolha de acesso (Entrar por CPF ou Cadastrar), validação algorítmica real de CPF (Módulo 11) com máscara `000.000.000-00` e máscara de telefone `(00) 0 0000-0000`.
- **Arquivos/migrações alterados:**
  - `/src/utils/cpfValidator.ts` (criado)
  - `/src/features/auth/AuthWelcomeScreen.tsx` (criado)
  - `/src/domain/entities.ts` (atualizado)
  - `/src/offline/store.ts` (atualizado)
  - `/src/services/firestoreSync.ts` (atualizado com consulta de CPF)
  - `/src/features/onboarding/OnboardingWizard.tsx` (atualizado com CPF e Telefone validados)
  - `/src/features/audit/AuditModal.tsx` (atualizado)
  - `/src/App.tsx` (atualizado)
  - `/firebase-blueprint.json` (atualizado)
  - `/firestore.rules` (regras implantadas)
  - `/docs/MANUAL_MESTRE.md` (revisado)
  - `/docs/LIVRO_RAIZ.md` (atualizado)
- **Backend:**
  - Banco de Dados: Firebase Firestore ativo (`ai-studio-folhaviva-bcbe6de4-6fb7-4087-8be0-5a49bfd455f9`).
  - Remoção completa de arquivos e diretórios legados do Supabase.
  - Regras de segurança Firestore atualizadas e implantadas com sucesso.
  - Consulta unificada por CPF com integridade e restauração de perfil, propriedades e talhões.
- **Frontend:**
  - Nova tela inicial (`AuthWelcomeScreen`): seleção direta entre "Entrar com CPF" e "Novo Cadastro".
  - Login por CPF: digitação única de CPF formatado; verificação algorítmica em tempo real; busca de perfil no Firestore; login automático.
  - Tela de Cadastro (`OnboardingWizard`): validação algorítmica de CPF com indicador visual de dígitos válidos e máscara de telefone.
- **Testes executados:**
  - Testes do algoritmo de validação de CPF (dígitos verificadores válidos vs inválidos e repetidos).
  - Teste de busca por CPF no Firestore e fallback local offline.
  - Linting TypeScript estrito (`tsc --noEmit`) sem erros.
  - Compilação do build de produção concluída com êxito.
- **Homologação:** Módulos 00 e 01 homologados com êxito em Firebase Firestore.
- **Desvios do manual:** Adaptação da infraestrutura de banco de dados para Firebase Firestore conforme solicitação explícita do titular.
- **Pendências:** Nenhuma pendência nos Módulos 00 e 01.

---

## Registro de Execução: V01-DB-PROVISIONING
- **ID da execução:** V01-DB-PROVISIONING
- **Data e responsável técnico:** 27/09/2026 - Engenharia AI Studio
- **Objetivo:** Provisionamento e integração de banco de dados na nuvem (projeto GCP: `gen-lang-client-0815660984`, região `us-east1`) para armazenamento persistente da plataforma Folha Viva.
- **Backend:** Banco de dados provisionado `ai-studio-folhaviva-bcbe6de4-6fb7-4087-8be0-5a49bfd455f9`.
- **Homologação:** Aprovado e ativo.
