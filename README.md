# Folha Viva

Retomada V01-E03/E04 → V02-E01, com contratos V14-E01/E02/E06 e V19-E01. Veja docs/LIVRO_RAIZ.md para evidências e pendências. V04 não iniciado.

## Executar

Node 22+ e pnpm 11. `pnpm install --frozen-lockfile`, `pnpm dev`. Verificações: `pnpm typecheck`, `pnpm test`, `pnpm build`. O build gera o shell offline; teste com `pnpm preview`. Use um único lockfile pnpm, inclusive na Vercel.

Copie .env.example para .env.local e configure URL/chave publishable do Supabase apenas se desejar envio remoto. Sem essas variáveis, cadastro funciona localmente e mostra “Salvo neste aparelho”. Segredos Gemini/service_role ficam exclusivamente no servidor; não são necessários neste marco.

## Banco e homologação

As migrações iniciais foram recuperadas do histórico aplicado, sem reaplicação. Os identificadores novos correspondem ao histórico do conector. Antes de push/reset, execute `pnpm exec supabase migration list` e confira o ambiente. Recriação limpa exige Docker e `supabase start` / `supabase db reset`; ainda não comprovada neste computador.

O projeto remoto está com login anônimo desativado. Por decisão do titular, homologação de identidade remota fica pendente. Quando habilitado, testar duas instalações distintas, fechamento/reabertura, cadastro offline, reconexão e recibos. O config.toml habilita anonimato apenas na instância local; não altera Auth remoto.

SQL de isolamento/idempotência em supabase/tests/identity_sync.sql executa com rollback e não deixa fazendas ou usuários de teste. Não usar service_role para testes de isolamento. Estado legado local é importado sem apagar os originais.
