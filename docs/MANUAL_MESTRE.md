# MANUAL MESTRE TÉCNICO, FUNCIONAL E VISUAL
## PLATAFORMA DE MONITORAMENTO AGRÍCOLA INTELIGENTE — FOLHA VIVA
**Café + Capim | Web responsivo + PWA mobile | Satélite + Clima + Offline + IA**

- **Versão:** 1.0 (Documento normativo)
- **Data-base:** 20/09/2026
- **Escopo inicial:** Monitoramento de café e capim
- **Modelo de entrega:** Full-stack vertical: backend + frontend + mobile + homologação
- **Fonte central do código:** GitHub
- **Infraestrutura-alvo:** Google Cloud Run + Firebase Firestore (`ai-studio-folhaviva-bcbe6de4-6fb7-4087-8be0-5a49bfd455f9`)
- **Registro de execução:** Livro Raiz obrigatório

---

### Princípios Invioláveis
1. **Regra de Ouro:** Nenhuma etapa é concluída se entregar apenas backend ou apenas frontend. A entrega é sempre vertical, integrada e testada.
2. **Sem dados fictícios na fundação:** A estrutura nasce pronta para receber os dados reais do produtor, sem tabelas preenchidas com fazendas ou talhões falsos.
3. **Identidade simplificada por CPF na V1:** O produtor pode escolher na primeira tela se quer entrar informando seu CPF ou iniciar um novo cadastro. O sistema reconhece o CPF e restaura os dados do Firestore e da memória local.
4. **Validação algorítmica real de CPF e máscara de telefone:** Validação com cálculo dos dois dígitos verificadores (Módulo 11) e máscaras automáticas `000.000.000-00` e `(00) 0 0000-0000`.
5. **Café e Capim:** Cada cultura possui dinâmicas separadas. Módulos como Florada são exclusivos de Café. Capim possui catálogo extensível de cultivares.
6. **Transparência Agronômica:** Distinguir claramente "medido", "observado", "estimado", "inferido" e "confirmado em campo".
7. **Offline-first:** PWA com armazenamento local, fila de mutações idempotente e sincronização com retorno de conexão ao Firebase Firestore.
8. **Design System do Cafeeiro:** Folha Profunda (`#173F2A`), Folha Viva (`#2F7D4A`), Folha Nova (`#8BCF9B`), Florada (`#FFFDF7`), Cereja Madura (`#B7372E`), Ramo (`#6B4A35`), Solo (`#D8C4A8`), Atenção (`#D99A22`).

---

### Módulo 00 — Constituição do Projeto (Implementação 100%)
- **V00-E01 - Escopo, cultura e limites da V1:** Congelado em Café e Capim sem opções de outras culturas na interface do onboarding. Feature flags ativas.
- **V00-E02 - Regra full-stack vertical:** Cada etapa é integrada de ponta a ponta com persistência e interface funcional.
- **V00-E03 - Manual Mestre + Livro Raiz:** Separação entre norma documental e diário de bordo de execução.
- **V00-E04 - Matriz de dependências e decisões:** Contratos TypeScript e arquitetura modular isolando UI de camadas de infraestrutura.
- **V00-E05 - Definição de pronto (DoD):** Compilação sem erros, linter estrito, estados vazios/offline tratados e sem credenciais expostas.

---

### Módulo 01 — Fundação Técnica (Implementação 100%)
- **V01-E01 - Repositório e estrutura:** Padrão modular `/src`, `/docs`, `/public`, scripts de build e verificação.
- **V01-E02 - Aplicação TypeScript e contratos:** Tipos fortemente definidos em `/src/domain/entities.ts` para `ProducerProfile`, `Property`, `Plot`, `CropCycle`, `FieldEvent`. Validação de entrada no limite do cliente/servidor com validador de CPF e máscara telefônica em `/src/utils/cpfValidator.ts`.
- **V01-E03 - Banco de Dados Firebase Firestore:** Esquema canônico documentado em `firebase-blueprint.json` e regras de segurança implantadas em `firestore.rules` (Default-deny, validação de IDs e integridade).
- **V01-E04 - Configuração e providers:** Serviços climáticos (Open-Meteo) e de satélite desacoplados em `/src/services`.
- **V01-E05 - Design System e PWA Shell:** Tokens de cores do cafeeiro, botões com alvo de toque $\ge 48\text{px}$, suporte a PWA instalável com `manifest.json` e ícone SVG.
