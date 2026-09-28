# LIVRO RAIZ DE EXECUÇÃO
Registro cronológico obrigatório de engenharia da Plataforma de Monitoramento Agrícola Inteligente — Folha Viva.

---

## Registro de Execução: V04-V05-ONDA-B-AMBIENTAL
- **ID da execução:** V04-V05-ONDA-B-AMBIENTAL
- **Data e responsável técnico:** 27/09/2026 - Engenharia AI Studio
- **Objetivo:** Implementação completa da Onda B de Dados Ambientais: Volume 04 (Satélite Sentinel-2 e radar Sentinel-1) e Volume 05 (Clima e Evapotranspiração FAO-56 Penman-Monteith). Garantia de zero dados fictícios, persistência estrita de todas as cenas e métricas no Firebase Firestore (`ai-studio-folhaviva-bcbe6de4-6fb7-4087-8be0-5a49bfd455f9`). Correção definitiva do salvamento de localização da fazenda e dos novos talhões criados dentro da conta com sincronização imediata no Firestore.
- **Arquivos/migrações alterados:**
  - `/src/services/satelliteProvider.ts` (consultas reais STAC Sentinel-2 L2A, radar S1, cálculo de NDVI, NDRE, NDMI e gravação no Firestore)
  - `/src/services/weatherProvider.ts` (integração Open-Meteo com persistência no Firestore em `weather_snapshots`)
  - `/src/services/firestoreSync.ts` (método `savePlotDirect` síncrono atualizando `plots`, `producers_by_cpf` e centroid de propriedade)
  - `/src/features/onboarding/OnboardingWizard.tsx` (derivação automática de centroid caso GPS não tenha sido acionado e clique no mapa para fixar sede da fazenda)
  - `/src/features/map/OpenMapView.tsx` (re-centralização e marcação de sede da fazenda ao clicar no mapa)
  - `/src/features/dashboard/ProducerDashboard.tsx` (cards de Satélite Sentinel-2 & Vigor Real e Clima Open-Meteo integrados)
  - `/src/App.tsx` (salvamento de novos talhões chamando `savePlotDirect`)
  - `/firebase-blueprint.json` (coleções `satellite_scenes`, `plot_satellite_metrics`, `weather_snapshots`)
  - `/firestore.rules` (regras implantadas no Firebase)
  - `/docs/MANUAL_MESTRE.md` (Volumes 04 e 05 documentados)
  - `/docs/LIVRO_RAIZ.md` (registro formal da execução)
- **Backend:**
  - Persistência das coleções `satellite_scenes`, `plot_satellite_metrics` e `weather_snapshots` no Firebase Firestore.
  - Regras de segurança implantadas com sucesso.
  - Fusão inteligente de talhões no login por CPF para garantir que nenhum talhão cadastrado seja esquecido.
- **Frontend:**
  - Card "Satélite Sentinel-2 & Vigor" em tempo real com data de aquisição da cena, cobertura de nuvens, confiabilidade e barras de progresso de NDVI, NDRE e umidade foliar.
  - Suporte ao radar Sentinel-1 para períodos nublados.
  - Fixação visual da localização da propriedade no mapa.
- **Testes executados:**
  - Consulta ao endpoint de satélite STAC e geração de métricas espectrais reais.
  - Consulta e persistência da estação meteorológica Open-Meteo no Firebase.
  - Verificação de salvamento de novo talhão e persistência no Firebase `producers_by_cpf`.
  - Typecheck limpo com `tsc --noEmit`.
  - Compilação de produção com `npm run build` bem-sucedida.
- **Homologação:** Onda B (Volumes 04 e 05) homologada com sucesso.

---

## Registro de Execução: V02-V03-EXECUTION-FULLSTACK
- **ID da execução:** V02-V03-EXECUTION-FULLSTACK
- **Data e responsável técnico:** 27/09/2026 - Engenharia AI Studio
- **Objetivo:** Implementação completa dos Módulos 02 e 03 do Manual Mestre, botão "Sair" padronizado e login direto por CPF.
- **Homologação:** Aprovado.

---

## Registro de Execução: V00-V01-CPF-AUTH-FIREBASE
- **ID da execução:** V00-V01-CPF-AUTH-FIREBASE
- **Data e responsável técnico:** 27/09/2026 - Engenharia AI Studio
- **Objetivo:** Implementação completa dos Módulos 00 e 01, substituição do Supabase pelo Firebase e validação algorítmica de CPF.
- **Homologação:** Aprovado.
