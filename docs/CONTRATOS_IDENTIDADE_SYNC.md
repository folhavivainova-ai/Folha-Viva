# Contratos V02-E01, V14-E01/E02/E06 e V19-E01

Estado: implementados para validação. Não equivalem à homologação de V02-E02 ou do volume V14 completo.

## Identidade e autorização

O identificador `dev_...` identifica a instalação, sem autorizar acesso. Supabase Auth cria a sessão anônima silenciosa quando configurado e conectado. `producer_profiles.owner_subject` referencia `auth.users.id`; RLS deriva propriedade → talhão → ciclo/evento. Nunca confiar em device_session_id ou user_metadata para autorização. Duas sessões precisam passar em testes de isolamento.

V19-E01: vincular uma sessão anônima à conta definitiva preservando o mesmo auth.uid(), por mecanismo oficial de identity linking. O vínculo não foi implementado nesta etapa. Troca de usuário ou perda da sessão bloqueia envio dos registros antigos e exige recuperação explícita; nunca transferir dados pelo UUID local. Sem sessão remota, o cadastro permanece utilizável no dispositivo.

## Persistência local — V14-E01

IndexedDB `folha-viva`, versão 1, guarda estado e outbox na mesma transação. Cadastro inteiro é atômico. Importação do localStorage anterior mantém IDs, registros e datas; reconstitui a fila em ordem, corrige produtor e extrai ciclos aninhados. O legado permanece intacto até limpeza explícita. Corrupção não é substituída silenciosamente por banco vazio. Não há dados iniciais de demonstração.

## Outbox e idempotência — V14-E02

Contrato tipado: UUID da mutação, entidade, ação insert/update, payload, timestamp, estado pending/failed/synced, tentativas e próxima tentativa. As entidades são producer_profile, property, plot, crop_cycle e field_event. Exclusão remota permanece fora deste contrato. Ordem de gravação preserva dependências e interrompe no primeiro erro. Uma única execução por aba; reenvios em outras abas são protegidos pelo recibo idempotente remoto e lock transacional. Repetição automática com backoff limitado a cinco minutos; botão permite tentar imediatamente.

RPC sync_mutation é SECURITY INVOKER e respeita RLS. Mutação e recibo são gravados na mesma transação. Reuso do ID com outro conteúdo é rejeitado. O cliente confirma ID da mutação, ID da entidade e data do commit antes de marcar synced. Geometrias do Leaflet [lat,lng] são convertidas para GeoJSON [lng,lat], com anel fechado e SRID 4326; PostGIS valida contorno e calcula área. Eventos são append-only. Testes SQL são revertidos integralmente.

## Reconexão e experiência — V14-E06

Estados: salvo neste aparelho, offline, enviando, envio pendente, erro e sincronizado. Retorno de rede, escrita e timer acionam o consumidor. Sem integração, mostrar estado local; falha não apaga os dados. Falha de armazenamento mantém formulário aberto. Recibos e erros persistem após reinício. Não há download/restauração remota ainda; backup entre dispositivos e resolução de conflitos continuam pendentes.

Shell estático é precacheado pelo service worker do build; Auth/REST, clima e tiles externos não entram no cache. A primeira abertura requer rede. Mapas offline extensos são V14-E05, fora deste marco.
