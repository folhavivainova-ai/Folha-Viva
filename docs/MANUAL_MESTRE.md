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
3. **Identidade simplificada por CPF na V1:** O produtor pode escolher na primeira tela se quer entrar informando seu CPF ou iniciar um novo cadastro. Ao digitar os 11 dígitos do CPF válido, o sistema reconhece e entra automaticamente. O botão "Sair" desloga e retorna imediatamente à tela inicial.
4. **Validação algorítmica real de CPF e máscara de telefone:** Validação com cálculo dos dois dígitos verificadores (Módulo 11) e máscaras automáticas `000.000.000-00` e `(00) 0 0000-0000`.
5. **Café e Capim:** Cada cultura possui dinâmicas separadas. Módulos como Florada são exclusivos de Café. Capim possui catálogo extensível de cultivares.
6. **Transparência Agronômica:** Distinguir claramente "medido", "observado", "estimado", "inferido" e "confirmado em campo".
7. **Offline-first:** PWA com armazenamento local, fila de mutações idempotente e sincronização com retorno de conexão ao Firebase Firestore.
8. **Design System do Cafeeiro:** Folha Profunda (`#173F2A`), Folha Viva (`#2F7D4A`), Folha Nova (`#8BCF9B`), Florada (`#FFFDF7`), Cereja Madura (`#B7372E`), Ramo (`#6B4A35`), Solo (`#D8C4A8`), Atenção (`#D99A22`).
9. **Linguagem Natural Limpa:** Uso exclusivo da conjunção gramatical "e" em todas as interfaces, relatórios e telas técnicas, banindo o símbolo comercial estranho.

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

---

### Módulo 02 — Cadastro Inicial sem Login (Implementação 100%)
- **V02-E01 - Identidade técnica invisível e vinculação:** Sessão por dispositivo (`device_session_id`) vinculada no Firestore às coleções `producers` e `producers_by_cpf`.
- **V02-E02 - Cadastro do produtor e propriedade:** Coleta de CPF (com validação Módulo 11), telefone formatado, nome do produtor, nome da propriedade e perfil de atividade (Café, Capim ou Misto).
- **V02-E03 - Localização por GPS e confirmação:** Captura de coordenadas do aparelho via GPS com precisão reportada em metros e conferência no mapa interativo com Leaflet.
- **V02-E04 - Perfil de cultura inicial:** Configuração de Café (Clonal vs Convencional e cultivar opcional) e Capim (catálogo com cultivares e campo aberto para novas variedades).
- **V02-E05 - Cadastro offline e retomada:** Persistência no armazenamento local e sincronização automática via `FirestoreSyncService`.

---

### Módulo 03 — Geoespacial, Propriedade e Talhões (Implementação 100%)
- **V03-E01 - Limite da propriedade:** Representação geoespacial em polígonos, validação de fecho com 3+ pontos e cálculo de área em hectares via fórmula geodésica esférica.
- **V03-E02 - Criação e edição de talhões:** Unidade canônica `Plot` com coordenadas, cálculo de `areaHa`, centroide, nome e ciclo de cultura ativo.
- **V03-E03 - Cultura por talhão:** Cada talhão gerencia seu ciclo de cultura (Café Arábica/Conilon ou Capim) exibido em cartões com status e área.
- **V03-E04 - Mapas base, satélite, híbrido e camadas agrícolas:** Alternância fluida entre camadas (Satélite Esri, Mapa de Ruas OpenStreetMap, Relevo TopoMap e polígonos agrícolas).
- **V03-E05 - Minha posição no campo:** Ferramenta "Onde estou" com centralização da visão e anel de precisão geográfica sem drenagem contínua de bateria.

---

### Módulo 04 — Dados de Satélite (Onda B - Implementação 100%)
- **V04-E01 - Contrato de provider e busca por AOI:** Consulta direta a cenas Sentinel-2 L2A via catálogo aberto STAC sem dados fictícios.
- **V04-E02 - Sentinel-2 óptico:** Ingestão de cenas com data real, cálculo de percentual de cobertura de nuvens e derivação de índices espectrais (NDVI, NDRE, NDMI).
- **V04-E03 - Sentinel-1 radar:** Sinal de radar complementar ativo para suporte em períodos de nebulosidade.
- **V04-E04 - Qualidade, frescor e confiança:** Cálculo de confiabilidade (Alta, Moderada, Baixa) com exibição transparente da data de aquisição e ausência de simulação mística.
- **V04-E05 - Cache e persistência no Firebase:** Metadados gravados na coleção `satellite_scenes` e métricas por talhão gravadas em `plot_satellite_metrics` no Firebase Firestore.

---

### Módulo 05 — Clima e Evapotranspiração (Onda B - Implementação 100%)
- **V05-E01 - Provider climático desacoplado:** Open-Meteo integrado com dados horários e diários reais para as coordenadas exatas da fazenda.
- **V05-E02 - Histórico de chuva e clima:** Série dos últimos 7 dias com precipitação acumulada em milímetros.
- **V05-E03 - ET0 e demanda atmosférica:** Cálculo padrão FAO-56 Penman-Monteith com demanda de água expressa em mm/dia.
- **V05-E04 - Cache e persistência no Firebase:** Snapshots meteorológicos salvos no Firebase Firestore na coleção `weather_snapshots` e no LocalStorage para resiliência offline.

---

### Módulo 07 — Motor Agronômico do Café (Onda C - Implementação 100%)
- **V07-E01 - Perfil do café:** Metadados de subtipo (clonal vs convencional), cultivar, espaçamento e regime hídrico.
- **V07-E02 - Fenologia e calendário observado:** Identificação de fases (brotação, pré-florada, florada, pegamento, enchimento e maturação) com cálculo de probabilidade e quebra de dormência por chuvas.
- **V07-E03 - Baseline de vigor do talhão:** Interpretação do NDVI relativo e desvio da média histórica.
- **V07-E04 - Recomendações explicáveis:** "O que fazer agora" com até 3 prioridades acionáveis salvas na coleção `agronomic_recommendations`.

---

### Módulo 08 — Motor Agronômico do Capim (Onda C - Implementação 100%)
- **V08-E01 - Catálogo extensível de capins:** Variedades forrageiras abertas (Brachiaria, Mombaça, Marandu, Tifton e customizadas).
- **V08-E02 - Ciclo e uso do talhão:** Rotação de piquetes, dias de descanso pós-pastejo e monitoramento de entrada e saída do gado.
- **V08-E03 - Vigor e cobertura:** Proxy de biomassa e rebrota derivado do NDVI com alerta de sobrepastejo.
- **V08-E04 - Água e alertas de pastagem:** Demanda hídrica com parâmetros radiculares próprios de gramíneas, sem reutilizar regras de café e com florada desabilitada.

---

### Módulo 09 — Irrigação e Balanço Hídrico (Onda C - Implementação 100%)
- **V09-E01 - Parâmetros hídricos por talhão:** Capacidade de Água Disponível (CAD), profundidade radicular $Z_r$, coeficiente de cultura $K_c$ e fração de depleção crítica $p$.
- **V09-E02 - Balanço hídrico diário:** Algoritmo FAO-56 que cruza chuva efetiva, $ET_c$ diário e armazenamento no perfil do solo.
- **V09-E03 - Registro de irrigação:** Aplicação de lâmina em milímetros direto no painel com recalculo instantâneo da reserva hídrica e persistência no Firebase Firestore (`irrigation_assessments`).
- **V09-E04 - Recomendação e confiança:** Status operacional (Adequado, Atenção, Irrigar Hoje) com cálculo de lâmina líquida de reposição e justificativa transparente.
- **V09-E05 - Preparação para sensores futuros:** Compatível com dados de tensiômetros e sondas capacitivas sem necessidade de refatoração do motor.
