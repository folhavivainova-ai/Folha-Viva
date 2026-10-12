# Definição de pronto — V00-E02/E05

Cada etapa só é concluída com evidência integrada, identificada por commit, ambiente e data. Passar build ou publicar deploy isoladamente não homologa a etapa.

- [ ] Migrações versionadas correspondem ao histórico remoto; recriação limpa comprovada.
- [ ] Serviço e validações de entrada testados, geometrias SRID 4326 válidas.
- [ ] RLS testada com duas identidades; leitura e escrita cruzadas negadas.
- [ ] Nenhum segredo de servidor no cliente ou artefatos públicos.
- [ ] Formulário → armazenamento → serviço → banco → confirmação validado.
- [ ] Estados loading, vazio, erro, sucesso, offline e dado antigo exercitados.
- [ ] Encerrar/reabrir preserva identidade, registros e fila; falha de envio não perde dados.
- [ ] Fluxo completo em desktop e celular, toque, orientação e largura pequena.
- [ ] Typecheck, testes de domínio e build passam; lint adicional quando houver configuração.
- [ ] Livro Raiz contém arquivos, comportamento, evidências, limites e status real.

O script `lint` herdado executa typecheck, não ESLint. Essa distinção deve constar nas evidências. Preenchimento deste checklist não substitui os critérios específicos da norma.
