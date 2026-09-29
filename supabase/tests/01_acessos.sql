-- Testes de acessos (correm em Postgres local com o stub). Cada bloco falha com erro se o resultado não for o esperado.
\set ON_ERROR_STOP 1
create or replace function pg_temp.entrar(p_email text, p_sub uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_sub, 'email', p_email)::text, false);
end $$;
create or replace function pg_temp.check(p_ok boolean, p_msg text) returns void language plpgsql as $$
begin
  if not p_ok then raise exception 'FALHOU: %', p_msg; end if;
  raise notice 'ok  %', p_msg;
end $$;

-- ids de login fictícios
select pg_temp.entrar('fm@shaken.pt',  '00000000-0000-0000-0000-00000000f001');
set role authenticated;
select pg_temp.check(public.fb_ligar_utilizador(), 'FM consegue entrar');
select pg_temp.check((select count(*) from public.documentos) = 17, 'FM (admin) vê os 17 documentos');
select pg_temp.check((select count(*) from public.entidades) = 5, 'FM vê as 5 entidades');
select pg_temp.check((select count(*) from public.auditoria) > 0, 'FM vê o registo de alterações');
reset role;

select pg_temp.entrar('lt@shaken.pt',  '00000000-0000-0000-0000-00000000f003');
set role authenticated;
select pg_temp.check(public.fb_ligar_utilizador(), 'Liliana (Finance) consegue entrar');
select pg_temp.check((select count(*) from public.documentos) = 17, 'Finance vê todos os documentos');
select pg_temp.check((select count(*) from public.auditoria) = 0, 'Finance não vê o registo de alterações');
do $$ begin
  begin
    update public.entidades set regime_iva = 'x' where codigo = 'TOP';
    if found then raise exception 'FALHOU: Finance alterou uma entidade'; end if;
  exception when insufficient_privilege then null; end;
  raise notice 'ok  Finance não altera entidades';
end $$;
insert into public.cdg_projeto (nome) values ('Projeto de teste Finance');
select pg_temp.check(exists (select 1 from public.cdg_projeto where nome = 'Projeto de teste Finance'), 'Finance acrescenta valores ao CdG');
reset role;

-- Pessoa não registada
select pg_temp.entrar('desconhecido@gmail.com', '00000000-0000-0000-0000-0000000000aa');
set role authenticated;
select pg_temp.check(not public.fb_ligar_utilizador(), 'Pessoa não registada não entra');
select pg_temp.check((select count(*) from public.documentos) = 0, 'Pessoa não registada não vê documentos');
select pg_temp.check((select count(*) from public.entidades) = 0, 'Pessoa não registada não vê entidades');
reset role;

-- Anónimo
set role anon;
select pg_temp.check((select count(*) from public.documentos) = 0, 'Anónimo não vê documentos');
reset role;

-- Critério de feito: o FCR fica temporariamente só com Aprovador (Finance_and_Legal)
select pg_temp.entrar('fm@shaken.pt',  '00000000-0000-0000-0000-00000000f001');
set role authenticated;
update public.perfis set ate = current_date - 1
  where pessoa_id = (select id from public.pessoas where email = 'fcr@shaken.pt') and perfil = 'administrador';
reset role;

select pg_temp.entrar('fcr@shaken.pt', '00000000-0000-0000-0000-00000000f002');
set role authenticated;
select pg_temp.check(public.fb_ligar_utilizador(), 'FCR consegue entrar');
select pg_temp.check((select count(*) from public.documentos) = 4, 'FCR (só aprovador de Finance_and_Legal) vê 4 documentos');
select pg_temp.check((select bool_and(cc = 'Finance_and_Legal') from public.documentos), 'e são todos de Finance_and_Legal');
select pg_temp.check((select count(*) from public.pessoas) = 1, 'FCR sem admin só vê a sua ficha');
do $$ begin
  begin
    perform public.fb_ver_como((select id from public.pessoas limit 1));
    raise exception 'FALHOU: não-admin usou Ver como';
  exception when insufficient_privilege then raise notice 'ok  Não-admin não usa "Ver como"'; end;
end $$;
reset role;

-- Ver como o Rodrigo (Facilities_and_IT)
select pg_temp.entrar('fm@shaken.pt',  '00000000-0000-0000-0000-00000000f001');
set role authenticated;
select pg_temp.check(
  (select jsonb_array_length(public.fb_ver_como((select id from public.pessoas where nome = 'Rodrigo Nevoa')) -> 'documentos')) = 5,
  'Ver como o Rodrigo: 5 documentos de Facilities_and_IT');
select pg_temp.check(exists (select 1 from public.auditoria where acao = 'VER_COMO'), '"Ver como" fica registado');
-- Repor o FCR como administrador
update public.perfis set ate = null
  where pessoa_id = (select id from public.pessoas where email = 'fcr@shaken.pt') and perfil = 'administrador';
reset role;

-- Último administrador não pode sair
select pg_temp.entrar('fm@shaken.pt',  '00000000-0000-0000-0000-00000000f001');
set role authenticated;
do $$ begin
  begin
    update public.perfis set ate = current_date - 1 where perfil = 'administrador';
    set constraints all immediate;
    raise exception 'FALHOU: ficou sem administradores';
  exception when check_violation then raise notice 'ok  Não se pode ficar sem administradores'; end;
end $$;
reset role;

-- Desativar tira o acesso
select pg_temp.entrar('fm@shaken.pt',  '00000000-0000-0000-0000-00000000f001');
set role authenticated;
update public.pessoas set ativa = false where email = 'jc@shaken.pt';
reset role;
select pg_temp.entrar('jc@shaken.pt',  '00000000-0000-0000-0000-00000000f006');
set role authenticated;
select pg_temp.check(not public.fb_ligar_utilizador(), 'Pessoa desativada não entra');
reset role;
select pg_temp.check((select pode_entrar = false and desativada_em is not null from public.pessoas where email = 'jc@shaken.pt'), 'Desativar marca a data e retira "pode entrar"');

-- Validação de caminho
select pg_temp.check(cardinality(public.fb_validar_caminho((select id from public.entidades where codigo='TOP'),
  'TUMO_2627','Lisboa','Facilities_and_IT','Cleaning_and_Hygiene','Cleaning Services','OPEX')) = 0, 'Caminho válido passa');
select pg_temp.check(cardinality(public.fb_validar_caminho((select id from public.entidades where codigo='TOP'),
  'TUMO_2627','Coimbra','Rental_Ops','Cleaning_and_Hygiene','Cleaning Services','OPEX')) = 2, 'Caminho inválido é apanhado');
select pg_temp.check(cardinality(public.fb_validar_caminho((select id from public.entidades where codigo='TOP'),
  'TUMO_2627','Setubal','TUMO_HQ','Royalties','Royalties','OPEX')) = 0, 'Setúbal tem os CC de um centro TUMO');

-- Registo de alterações é só de leitura
select pg_temp.entrar('fm@shaken.pt',  '00000000-0000-0000-0000-00000000f001');
set role authenticated;
delete from public.auditoria;
select pg_temp.check((select count(*) from public.auditoria) > 0, 'Nem um administrador apaga o registo de alterações');
reset role;
set role authenticated;
do $$ begin
  begin
    perform public.fb_resumo_acessos_interno((select id from public.pessoas limit 1));
    raise exception 'FALHOU: função interna chamável';
  exception when insufficient_privilege then raise notice 'ok  Funções internas não são chamáveis pela app'; end;
end $$;
reset role;
set role anon;
do $$ begin
  begin
    perform public.fb_meus_acessos();
    raise exception 'FALHOU: anónimo chamou fb_meus_acessos';
  exception when insufficient_privilege then raise notice 'ok  Anónimo não chama funções da app'; end;
end $$;
reset role;
\echo 'TODOS OS TESTES PASSARAM'
