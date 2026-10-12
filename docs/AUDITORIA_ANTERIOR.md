> Fragmento recuperado do histórico da conversa anterior. A ferramenta limitou o texto original; este arquivo não é a íntegra da auditoria. A situação atual está em LIVRO_RAIZ.md e VERIFICACAO_RETOMADA.md.

# Auditoria do Folha Viva e plano de retomada

Data de referência: 11/10/2026 (America/Cuiaba). Manual: PDF v1.0, data-base 20/09/2026.

## Conclusão

O projeto está na Onda A, com fundação e experiência local parcialmente construídas. Há antecipações de clima (Onda B), caderno de campo e experiência simples/técnica. Não há evidência para homologar V00–V03 como entrega vertical: o aplicativo não está integrado ao Supabase, a identidade é apenas local, não há sincronização e falta o service worker para abertura offline controlada.

Preservar a interface e os contratos úteis. Primeiro fechar V00/V01 e V02 com os contratos de V14/V19; depois completar V03. Avançar para dados ambientais somente após essa base passar nos critérios do manual.

## Fontes e limites da inspeção

- GitHub: [folhavivainova-ai/Folha-Viva](https://github.com/folhavivainova-ai/Folha-Viva), branch `main`, commit `f23a362eca1ed9ca116875a80fc9339cf39af236` de 28/09/2026. Arquivos lidos por conector em referência fixa; cópia local em `/workspace/Folha-Viva`, sem checkout Git e sem instalação das dependências.
- Supabase: projeto `vzvtzorayztjqkwmlwms`, nome `folhavivainova-ai's Project`, região `ca-central-1`, status `ACTIVE_HEALTHY`, PostgreSQL 17.6. Consulta de esquema, migrações, advisors, políticas, buckets e contagens.
- Vercel: projeto `folha-viva`, ID `prj_ssx37BYTGO3xvrNzqgSjpAt1iwFb`. Metadados, deploys e nomes de variáveis consultados. Nenhum segredo foi descriptografado.
- PDF: os 21 volumes, a matriz de dependências, as ondas A–E e a definição de pronto foram usados como norma. O Markdown no GitHub é um resumo, não a íntegra do PDF.
- Não foram feitas alterações no banco, commits no GitHub ou releases na Vercel. Esta entrega é auditoria e planejamento.
- Build/typecheck local, navegador desktop/mobile, instalação PWA, acesso por dois dispositivos e operação offline real não foram executados. Não considerar homologados.
- Logs de build e leitura autenticada da aplicação pela Vercel retornaram 403. A CLI Vercel não está instalada neste ambiente. A conexão precisa autorizar o projeto/equipe para concluir essas verificações; se já autorizados, verificar a permissão da conta.

## O que já existe

| Área | Evidência encontrada | Limite atual |
|---|---|---|
| Aplicação | React + TypeScript + Vite + Tailwind | O manual referencia Next.js; não há servidor/API implementado |
| Interface | Button, Card, StatusChip, EmptyState, modais, modos simples e técnico | Responsividade e acessibilidade ainda precisam de homologação |
| Cadastro | Nome do produtor/propriedade, Café/Capim/Misto, GPS, perfil de cultura, primeiro talhão opcional | Salvo exclusivamente em localStorage |
| Identidade | UUID por dispositivo com prefixo `dev_` | Não equivale a sessão Supabase Auth nem comprova propriedade para RLS |
| Mapas | Leaflet, OSM, Esri World Imagery e OpenTopoMap; desenho e área aproximada; localização em campo | Não é MapLibre; faltam perímetro da propriedade, edição, validações e camadas agrícolas/híbridas |
| Caderno | Inspeção, nota, ocorrência, irrigação, corte, pastejo e florada observada | Persistência local; sem fotos, Storage, georreferência dos eventos ou tarefas |
| Clima | Requisição ao Open-Meteo, chuva de 7 dias, ET0, previsão e cache local | Sem persistência no banco, validação adequada ou cache por localização |
| Satélite | Interfaces para cenas e métricas | Implementação retorna arrays vazios; imagem do mapa não é monitoramento Sentinel |
| Offline | Store local e fila de mutações, indicador de rede | Sem consumidor da fila, confirmação remota, IndexedDB ou service worker |
| PWA | Manifest, SVG, metadados e botão de instalação | Instalabilidade e abertura offline não verificadas; manifest sozinho não entrega offline-first |
| Documentação | Manual resumido e Livro Raiz de 27/09/2026 | Declarações de homologação e segurança precisam de retificação |

## Supabase: estado confirmado

Existem 15 tabelas de aplicação: `producer_profiles`, `properties`, `plots`, `crop_varieties`, `crop_cycles`, `field_events`, `field_photos`, `satellite_scenes`, `plot_satellite_metrics`, `weather_series`, `irrigation_assessments`, `flowering_assessments`, `carbon_estimates`, `alerts` e `feature_flags`. Também existe `spatial_ref_sys` do PostGIS.

As 15 tabelas de aplicação têm RLS habilitado, mas nenhuma política foi encontrada em `public` ou `storage`. Clientes comuns não têm o fluxo de leitura/escrita autorizado por proprietário. Não resolver desabilitando RLS ou expondo service role.

Contagem exata consultada: zero produtores, propriedades, talhões, eventos de campo, registros climáticos e usuários Auth. Isso confirma ausência de dados nessas entidades; não prova ausência de cadastros nos aparelhos. O inventário reportou zero linhas estimadas nas demais tabelas. Não existem buckets Storage nem Edge Functions. A ausência de Edge Functions não é um problema por si só: a execução server-side pode ficar na Vercel.

Migrações registradas no banco:

1. `20260927192113_v01_initial_canonical_schema`.
2. `20260927192122_v01_foundation_hardening`.

GitHub contém somente `20260920000000_v01_initial_canonical_schema.sql`. A migration do repositório cria 14 tabelas, não contém políticas/RLS nem a segunda migration. `feature_flags`, a view `foundation_health` e a função `set_updated_at` são evidências adicionais de mudanças não representadas nesse arquivo. O Livro Raiz menciona 12 tabelas. Antes de continuar, reconciliar conteúdo e histórico sem reaplicar migrations cegamente e sem apagar dados locais.

Achados de segurança confirmados pelos advisors:

- `spatial_ref_sys` em `public` sem RLS. A consulta de grants confirmou permissões de leitura e escrita, inclusive DELETE/TRUNCATE, para `anon` e `authenticated`. É uma tabela de referência do PostGIS, não dados de produtores, mas a exposição exige correção de privilégios/esquema e verificação das funções espaciais.
- `foundation_health` é uma view sem `security_invoker`, contando entidades de negócio; pode executar com privilégios do proprietário. Restringir diagnóstico e revisar permissões.
- `set_updated_at` tem `search_path` mutável.
- PostGIS instalado em `public`; avaliar isolamento e dependências antes de movimentar extensão.
- `rls_auto_enable` e três assinaturas de `st_estimatedextent` são SECURITY DEFINER executáveis por `anon`/`authenticated`. Revisar necessidade de exposição; a auditoria não executou essas funções nem demonstrou exploração.

Referências: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [view com privilégios do proprietário](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view), [search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [RLS desabilitado](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public), [extensão em public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public), [funções privilegiadas anônimas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Vercel: estado confirmado

- Quatro deploys listados, todos `READY`, com origem GitHub e destino production.
- Último: `dpl_w1Lqc3VGvLBY1YsCkHi5y8GrXBdb`, mesmo commit `f23a362…` da branch main. Domínio associado: [folha-viva.vercel.app](https://folha-viva.vercel.app).
- Framework Vite; Node 24.x. A duração entre `buildingAt` e `ready` é aproximadamente 6,9 segundos. Não inferir disso execução de typecheck/testes.
- Nomes de variáveis listados: `GEMINI_API_KEY` e `APP_URL`, em production/preview. Não foram listadas variáveis Supabase; nenhum valor foi aberto.
- SSO Protection está habilitado com configuração `all_except_custom_domains`. Validar o acesso pretendido dos produtores: identidade invisível do aplicativo e proteção de deploy são controles diferentes.
- `READY` comprova conclusão do deployment, não integração ao banco, correção agronômica, PWA offline ou homologação funcional.
- A inspeção inicial com teamId explícito recebeu 403; consultas de metadados no contexto disponível da conexão funcionaram. Logs e acesso protegido da aplicação permaneceram bloqueados.

## Correções em ordem de prioridade

| ID | Prioridade | Problema e consequência | Correção planejada |
|---|---|---|---|
| C01 | P0 | Exposição de objetos PostGIS/view/funções privilegiadas | Revisar grants, esquema, execução e search_path; migration versionada; advisors e testes de acesso |
| C02 | P0 | Identidade local sem Auth/RLS por dono | Sessão anônima silenciosa, owner ligado a `auth.uid()`, políticas para cada entidade e Storage |
| C03 | P0 | Banco e GitHub não reproduzem o mesmo histórico | Comparar DDL/histórico, representar hardening e reconciliar versões; testar reconstrução limpa |
| C04 | P0 | Não existe integração Supabase | Configuração validada, client/servidor e repositórios tipados; preservar dados locais na migração |
| C05 | P0 | `saveProducerProfile` enfileira entidade `property` | Adicionar tipo de mutação do produtor, corrigir dados pendentes e ordem pai→filho |
| C06 | P0 | Fila nunca é enviada; indicador afirma “Sincronizando” | Consumidor real, recibo remoto e estados pendente/enviando/sincronizado/erro; idempotência |
| C07 | P1 | Clima cria 24°C, 65%, 3,5 mm e outros padrões sem evidência | Usar ausente/indisponível; validar resposta, data, unidade e fonte; distinguir previsto de observado |
| C08 | P1 | Cache climático global pode misturar localidades e dados antigos | Cache por localização/propriedade, período/provedor, expiração e timestamp da fonte |
| C09 | P1 | LocalStorage não entrega offline-first completo | IndexedDB transacional, service worker, migração do legado, retenção e recuperação |
| C10 | P1 | Geometria usa lista `[lat,lng]`, diferente de GeoJSON | Adapter explícito para anéis fechados `[lng,lat]`; validar SRID, área e geometria no servidor |
| C11 | P1 | Falta perímetro/edição e área pode cair no padrão 1 ha | Desenhar propriedade, editar/desfazer talhões, rejeitar área nula/inválida; calcular em PostGIS |
| C12 | P1 | Ciclo está embutido no talhão, sem persistência separada | Persistir crop_cycles, garantir ciclo ativo e preservar histórico de mudanças |
| C13 | P1 | GPS negado promete escolha manual inexistente | Seleção/arraste de marcador, confirmação, precisão e timestamp persistidos; reagir à mudança de centro |
| C14 | P1 | Texto de nome do talhão é interpolado em HTML de tooltip | Criar conteúdo por textContent/DOM seguro; evitar injeção de HTML |
| C15 | P1 | Livro Raiz/modal afirmam homologação, RLS e offline sem suporte | Entrada de retificação com evidências; status por etapa; preservar registro histórico |
| C16 | P2 | Next.js/MapLibre previstos, Vite/Leaflet implementados | Registrar decisão e impactos; para aderência estrita, planejar migração reutilizando componentes |
| C17 | P2 | `lint` é apenas `tsc --noEmit`; sem testes e strict | Separar lint/typecheck/testes/build, validar fronteiras e remover any crítico |
| C18 | P2 | Zoom do navegador bloqueado e CSS Leaflet depende de CDN | Permitir zoom, homologar foco/contraste/toque; incluir recursos necessários no cache do shell |

P0: bloqueia integração segura e homologação da base. P1: bloqueia confiança funcional/offline. P2: tratar na fundação e refinamento correspondente, sem ignorar requisitos do manual.

## Reprodução de falhas realizada

Foram executados os módulos existentes de store e clima em Node 24 com remoção de tipos TypeScript, localStorage em memória e fetch controlado, sem acessar banco nem criar dados reais:

1. Salvar perfil gera mutation `entity=property`, com payload de produtor. Falha reproduzida.
2. Resposta HTTP bem-sucedida com JSON vazio retorna 24°C, umidade 65%, ET0 3,5 mm e “Céu limpo”, marcado `isCached=false`. Falha reproduzida.
3. Após cache em uma localização, falha de rede em outra retorna o mesmo cache global. Falha reproduzida.

Essas reproduções demonstram defeitos específicos, não substituem build ou teste em navegador. Na fila não existe rotina de envio; a constatação é também verificável por leitura integral do store e buscas no código.

## Matriz de situação dos 21 volumes

“Parcial” indica código/esquema existente, não homologação. “Planejado” indica somente estrutura, tipos ou tabela. “Não localizado” indica ausência de implementação no snapshot inspecionado.

| Volume | Situação | Evidência e pendência principal |
|---|---|---|
| 00 Constituição | Parcial | Documentos existem; retificar homologação e completar matriz/DoD/manual íntegro |
| 01 Fundação | Parcial, bloqueante | UI, tipos e SQL; faltam integração, segurança reproduzível, configuração e shell offline |
| 02 Cadastro | Parcial local | Wizard/GPS/culturas; faltam Auth invisível, RLS, persistência remota e sincronização |
| 03 Geoespacial | Parcial local | Talhões/mapas/GPS; faltam perímetro, edição, validação espacial e ciclos remotos |
| 04 Satélite | Planejado | Tabelas/interfaces; busca e métricas retornam vazio |
| 05 Clima | Parcial | Open-Meteo e ET0/cache; corrigir valores ausentes, histórico e persistência |
| 06 Relevo/solo | Não localizado como módulo | Basemap topográfico não implementa DEM/solo/drenagem/erosão |
| 07 Café | Perfil parcial | Subtipo/cultivar; sem fenologia, baseline e recomendações |
| 08 Capim | Perfil/eventos parciais | Variedade e manejo local; sem catálogo integrado, vigor e motor hídrico |
| 09 Irrigação | Registro local + esquema | Sem parâmetros, balanço diário ou recomendação calculada |
| 10 Índices/anomalias | Planejado | Tipos/tabela; sem processamento real ou séries |
| 11 Florada | Observação local + esquema | Sem elegibilidade/motor/janela e avaliação persistida |
| 12 Carbono/O2 | Planejado | Tabela; sem modelo, conversões e incerteza |
| 13 Campo/fotos | Parcial local | Caderno de eventos; faltam fotos, georreferência, tarefas e nuvem |
| 14 Offline/sync | Parcial, bloqueante | LocalStorage/fila; sem IndexedDB, envio, conflitos, anexos ou cache de mapas |
| 15 Gemini | Não localizado como funcionalidade | Dependência/chave configurada não equivalem a integração server-side |
| 16 Mobile/desktop | Parcial | Modos simples/técnico; sem resultados ambientais/agronômicos e testes de usabilidade |
| 17 Visualizações/relatórios | Não localizado | Sem comparador, filme, 3D, PDF ou exportação |
| 18 Alertas | Planejado | Tabela; sem motor, deduplicação e acompanhamento |
| 19 Perfis futuros | Não implementado | Sem vínculo confiável Auth/produtor; nenhuma tela de login é necessária na V1 |
| 20 Integração/homologação | Parcial | Git→Vercel confirmado; faltam banco integrado, regressão, offline e evidências finais |

## Ponto exato de retomada

Retomar **V01-E03 (Supabase/PostGIS/migrações)** e **V01-E04 (configuração/providers)**, com retificação **V00-E02/E03/E05**. Em seguida, entregar **V02-E01 (identidade invisível)** junto dos contratos **V14-E01/E02/E06** e **V19-E01**. O formulário local de V02-E02 pode ser aproveitado, mas não está concluído segundo a regra vertical. Não saltar diretamente para V04.

## Plano de execução com critérios de saída

### Etapa 0 — Fixar referência e corrigir governança

Volumes: V00-E01 a E05, V20-E05. Dependência: nenhuma.

- Versionar o PDF normativo ou equivalente completo e ligar o resumo à fonte. Criar matriz de etapa/status/evidência e registro de decisões.
- Registrar retificação do Livro Raiz, sem apagar a execução anterior: entrega local parcial; segurança/sync/offline ainda não homologados.
- Confirmar repo, commit, banco e domínio; completar acesso de leitura aos logs/aplicação na Vercel.
- Decidir arquitetura para cumprir Next.js/MapLibre, incluindo plano de reaproveitamento. Nenhum desvio deve continuar declarado como “Nenhum”.

Saída: referência normativa completa; matriz e decisões versionadas; cada etapa distingue implementado, integrado e homologado. O modo simples não exibe detalhes técnicos desnecessários.

### Etapa 1 — Fechar fundação, migrations e segurança

Volumes: V01-E01 a E05, V19-E01, V20-E03. Dependência: etapa 0.

- Recuperar DDL efetivo e comparar com ambas as migrations aplicadas. Representar hardening no GitHub; reconciliar histórico com procedimento documentado.
- Corrigir grants/view/funções/PostGIS conforme necessidade real e rever advisors. Não liberar tabelas de negócio publicamente.
- Configurar ambientes, acesso a dados tipado, schemas de entrada e execução server-side. Chaves secretas ficam somente no servidor.
- Separar lint, typecheck, testes de domínio e build; documentar instalação limpa e fixar versões/lockfile compatíveis.
- Preparar owner confiável e vínculos futuros sem inserir tela de login.

Saída: banco recriável a partir do repositório; build/verificações passam; RLS e funções revisados; configuração incompleta falha de forma clara; nenhum segredo no bundle.

### Etapa 2 — Cadastro vertical seguro e retomável

Volumes: V02-E01/E02/E04/E05, V14-E01/E02/E06, V19-E01. Dependência: etapa 1.

- Sessão Supabase anônima silenciosa e persistente; propriedade ligada ao sujeito autenticado. UUID do aparelho permanece identificador auxiliar, não autorização.
- IndexedDB, migração dos dados atuais de localStorage e fila transacional com entidade de produtor correta, ciclos separados e ordem de dependências.
- Envio idempotente, recibo após persistência, tentativas com intervalo progressivo e preservação de erros recuperáveis. Indicador informa estado verdadeiro.
- Onboarding aproveita telas atuais; Café/Capim/Misto e catálogo extensível permanecem sem senha/e-mail obrigatório.

Saída: cadastro aparece no banco e após reabrir; dispositivo A não lê/altera dados de B; offline→reconexão não duplica; falha temporária não perde dados; teste de fechamento durante envio passa em desktop e celular.

### Etapa 3 — Propriedade e talhões completos

Volumes: V02-E03, V03-E01 a E05, V14-E05. Dependência: etapa 2.

- Captura GPS com precisão/data, confirmação e ajuste manual real. Negação de permissão permite concluir o cadastro.
- Perímetro, criação/edição/desfazer de talhões, cultura e histórico dos ciclos. GeoJSON/PostGIS com conversão explícita e validação no servidor.
- Calcular hectares por geografia, rejeitar autointerseção/área zero e tratar talhão fora da propriedade com regra/exceção documentada.
- Camadas base/satélite/híbrida/relevo/agrícola com registro de providers; tratamento de tiles indisponíveis e conteúdo seguro nos tooltips.

Saída: polígonos conhecidos têm área/posição corretas após ida e volta ao banco; edição recalcula área; troca de camada preserva geometria; propriedade mista suporta ambos os tipos; GPS funciona com consentimento.

### Etapa 4 — Clima confiável e histórico

Volumes: V05-E01 a E04, V16, V14. Dependência: etapa 3.

- Validar payload, remover padrões numéricos não observados, distinguir previsão/histórico/modelo e identificar data/unidade/fonte.
- Persistir séries e ET0; cache por local/provedor/período, validade explícita e tratamento de ausência/atraso. Não chamar dados modelados de leitura de estação local.
- Apresentar resumo mobile e histórico técnico consumindo o mesmo serviço.

Saída: dados correspondem à localização e ao período; falha do provider não gera clima inventado; troca de propriedade não reutiliza cache indevido; histórico mantém rastreabilidade e offline indica idade.

### Etapa 5 — Satélite, índices, relevo e solo

Volumes: V04, V06, V10, V16; Onda B. Dependência: etapas 3 e 4.

- Provider real por AOI e período; Sentinel-2 e Sentinel-1, qualidade/nuvens, cenas, métricas e cache processado.
- NDVI/NDRE/NDMI e índices aplicáveis, zonas e tendências; DEM/declividade/drenagem e solo de referência com limites explícitos.
- Considerar disponibilidade e custo dos providers antes de assumir processamento contínuo no plano gratuito.

Saída: um talhão real tem dados ambientais persistidos e explicáveis, fonte/data/qualidade/confiança visíveis; sem ce
