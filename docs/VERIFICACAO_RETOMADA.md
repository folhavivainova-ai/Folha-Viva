# Verificação da retomada — 11/10/2026

História: produtor entra sem login → cadastro → IndexedDB/outbox → sessão Auth → RPC com RLS → recibo → estado da tela. O titular escolheu deixar Auth remoto/homologação pendentes.

| Fronteira | Resultado | Evidência |
|---|---|---|
| UI → store local | Passou | Cadastro no navegador em 127.0.0.1:4173; produtor e propriedade reapareceram após reload |
| Estado sem backend configurado | Passou | “Salvo neste aparelho (2)”, sem falsa sincronização |
| Shell sem servidor | Passou | Após instalação do worker, preview 4173 desligado e reload preservou tela/registros; não equivale a instalação em aparelho real |
| Mobile | Parcial | Viewport 390×844; conteúdo com largura 375, sem overflow horizontal; instalação/orientação em aparelho real pendentes |
| Importação e reinício | Passou em testes | IDs mantidos, ciclos separados, legado corrompido não substituído |
| Outbox → confirmação | Passou em testes | Falha mantém fila; interrupção após pai; consumidor único por aba; recibo validado |
| RLS/RPC → banco | Passou em SQL transacional | Todas as cinco entidades; duas identidades simuladas, repetição/reuso, leitura/escrita cruzadas; rollback |
| Sessão anônima real → banco → UI | Pendente | GET /auth/v1/settings indica anonymous_users=false; decisão do titular |
| Recriação limpa do banco | Pendente | Docker indisponível neste computador |
| Extensão PostGIS | Pendente de administração | Instalada em public sob supabase_admin; conexão postgres não pode revogar grants desse dono |

Evidência visual local: docs/evidencias/cadastro-local-mobile.jpg. Registros exibidos nessa captura são exclusivamente da validação local; não foram enviados ao Supabase. Banco remoto permaneceu com zero usuários, produtores e recibos após rollback.

Build apresenta aviso de bundle acima de 500 kB; otimização de carregamento fica pendente. O shell gerado não cacheia Auth, APIs remotas ou tiles de mapas. Isso não homologa V14-E05 nem PWA em dispositivo real.

Console do navegador: nenhuma entrada de erro de aplicação no teste local final. Revisão React: efeitos com limpeza, handlers assíncronos aguardam persistência, mensagens de erro/status acessíveis, entrada do talhão renderizada como texto no tooltip, componentes consomem serviços. Modais antigos ainda precisam revisão completa de foco/teclado no marco visual.
