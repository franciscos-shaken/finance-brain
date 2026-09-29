-- Finance Brain · S1.1 · Fundações
-- Entidades, caixas, dimensões do CdG, pessoas, perfis, regras de owner,
-- documentos (base para os módulos seguintes), registo de alterações e acessos (RLS).
-- Spec: specs/S1.1_fundacoes.md

-- ─────────────────────────────────────────────────────────────
-- 1. Entidades, contas bancárias e caixas de faturas
-- ─────────────────────────────────────────────────────────────
create table public.entidades (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome_legal text not null,
  tipo text not null,
  pais text not null default 'PT',
  nif text not null unique,
  regime_iva text,
  moeda text not null default 'EUR',
  codigo_primavera text,
  forma_obrigar text,
  ativa_desde date,
  ativa_ate date,
  criado_em timestamptz not null default now()
);

create table public.contas_bancarias (
  id uuid primary key default gen_random_uuid(),
  entidade_id uuid not null references public.entidades(id),
  banco text not null,
  iban text not null unique,
  bic text,
  descricao text,
  formato_extrato text,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

create table public.caixas_faturas (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  descricao text,
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. Dimensões do CdG (espelham as folhas da BD_Dropdowns_MasterFile)
--    BU → Produto → CC ; CC → Categoria ; Categoria → Detalhe ; Detalhe → Tipo
-- ─────────────────────────────────────────────────────────────
create table public.cdg_bu (
  codigo text primary key,
  familia text not null,
  epoca text,
  ativo boolean not null default true,
  notas text
);

create table public.cdg_entidade_bu (
  entidade_id uuid not null references public.entidades(id) on delete cascade,
  bu text not null references public.cdg_bu(codigo) on update cascade on delete cascade,
  primary key (entidade_id, bu)
);

create table public.cdg_produto (
  id uuid primary key default gen_random_uuid(),
  bu text not null references public.cdg_bu(codigo) on update cascade on delete cascade,
  produto text not null,
  ativo boolean not null default true,
  unique (bu, produto)
);

create table public.cdg_cc (
  id uuid primary key default gen_random_uuid(),
  bu text not null,
  produto text not null,
  cc text not null,
  ativo boolean not null default true,
  unique (bu, produto, cc),
  foreign key (bu, produto) references public.cdg_produto(bu, produto) on update cascade on delete cascade
);

create table public.cdg_categoria (
  id uuid primary key default gen_random_uuid(),
  cc text not null,
  categoria text not null,
  ativo boolean not null default true,
  unique (cc, categoria)
);

create table public.cdg_detalhe (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  detalhe text not null,
  ativo boolean not null default true,
  unique (categoria, detalhe)
);

create table public.cdg_tipo (
  id uuid primary key default gen_random_uuid(),
  detalhe text not null,
  tipo text not null,
  ativo boolean not null default true,
  unique (detalhe, tipo)
);

create table public.cdg_projeto (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true
);

-- ─────────────────────────────────────────────────────────────
-- 3. Pessoas, perfis e acesso salarial
-- ─────────────────────────────────────────────────────────────
create table public.pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  entidade_id uuid references public.entidades(id),
  funcao text,
  ativa boolean not null default true,
  pode_entrar boolean not null default false,
  auth_user_id uuid unique,
  desativada_em timestamptz,
  criado_em timestamptz not null default now()
);
create unique index pessoas_email_unico on public.pessoas (lower(email));

create type public.perfil_app as enum ('administrador', 'finance', 'leitura', 'colaborador');

create table public.perfis (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  perfil public.perfil_app not null,
  entidade_id uuid references public.entidades(id),  -- vazio = todas as entidades
  desde date not null default current_date,
  ate date,
  criado_em timestamptz not null default now()
);

create table public.acesso_salarial (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  desde date not null default current_date,
  ate date,
  criado_em timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 4. Regras de owner (aprovação): família de BU × CC, com espaço
--    para produto e categoria no futuro (a mais específica ganha)
-- ─────────────────────────────────────────────────────────────
create table public.regras_owner (
  id uuid primary key default gen_random_uuid(),
  bu_familia text not null,
  cc text not null,
  produto text,
  categoria text,
  desde date not null default current_date,
  ate date,
  notas text,
  criado_em timestamptz not null default now()
);

create table public.regra_aprovadores (
  regra_id uuid not null references public.regras_owner(id) on delete cascade,
  pessoa_id uuid not null references public.pessoas(id),
  papel text not null default 'aprovador' check (papel in ('aprovador', 'substituto')),
  primary key (regra_id, pessoa_id)
);

-- ─────────────────────────────────────────────────────────────
-- 5. Documentos (faturas, notas de crédito, despesas)
--    Nesta fase servem para provar os acessos; os módulos seguintes enriquecem-na.
-- ─────────────────────────────────────────────────────────────
create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  entidade_id uuid not null references public.entidades(id),
  caixa_id uuid references public.caixas_faturas(id),
  tipo_documento text not null default 'fatura' check (tipo_documento in ('fatura', 'nota_credito', 'despesa')),
  numero text,
  fornecedor_nome text,
  fornecedor_nif text,
  data_documento date,
  valor_total numeric(14, 2),
  bu text,
  produto text,
  cc text,
  categoria text,
  detalhe text,
  tipo text,
  projeto text,
  contraparte text,
  link text,
  estado text not null default 'por_classificar'
    check (estado in ('por_classificar', 'por_aprovar', 'aprovado', 'devolvido', 'rejeitado')),
  submetido_por uuid references public.pessoas(id),
  criado_em timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 6. Registo de alterações (ninguém edita nem apaga)
-- ─────────────────────────────────────────────────────────────
create table public.auditoria (
  id bigserial primary key,
  tabela text not null,
  registo_id text,
  acao text not null,
  antes jsonb,
  depois jsonb,
  pessoa_id uuid,
  auth_user_id uuid,
  em timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 7. Funções de acesso
-- ─────────────────────────────────────────────────────────────
create or replace function public.fb_pessoa_atual()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.pessoas
  where auth_user_id = auth.uid() and ativa and pode_entrar
$$;

create or replace function public.fb_tem_perfil(p_pessoa uuid, p_perfil public.perfil_app, p_entidade uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfis pf join public.pessoas p on p.id = pf.pessoa_id
    where pf.pessoa_id = p_pessoa and p.ativa and pf.perfil = p_perfil
      and pf.desde <= current_date and (pf.ate is null or pf.ate >= current_date)
      and (p_entidade is null or pf.entidade_id is null or pf.entidade_id = p_entidade)
  )
$$;

create or replace function public.fb_is_admin(p_pessoa uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select public.fb_tem_perfil(coalesce(p_pessoa, public.fb_pessoa_atual()), 'administrador')
$$;

create or replace function public.fb_is_finance(p_pessoa uuid default null, p_entidade uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select public.fb_tem_perfil(coalesce(p_pessoa, public.fb_pessoa_atual()), 'finance', p_entidade)
      or public.fb_tem_perfil(coalesce(p_pessoa, public.fb_pessoa_atual()), 'administrador')
$$;

create or replace function public.fb_familia(p_bu text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select familia from public.cdg_bu where codigo = p_bu), p_bu)
$$;

-- A pessoa é aprovador ou substituto numa regra em vigor que cobre esta classificação?
create or replace function public.fb_aprova(p_pessoa uuid, p_bu text, p_cc text, p_produto text default null, p_categoria text default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.regras_owner r
    join public.regra_aprovadores a on a.regra_id = r.id
    join public.pessoas p on p.id = a.pessoa_id
    where a.pessoa_id = p_pessoa and p.ativa
      and r.bu_familia = public.fb_familia(p_bu) and r.cc = p_cc
      and (r.produto is null or r.produto = p_produto)
      and (r.categoria is null or r.categoria = p_categoria)
      and r.desde <= current_date and (r.ate is null or r.ate >= current_date)
  )
$$;

create or replace function public.fb_pode_ver_documento(
  p_pessoa uuid, p_entidade uuid, p_bu text, p_cc text, p_produto text, p_categoria text, p_submetido_por uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_pessoa is not null and (
       public.fb_tem_perfil(p_pessoa, 'administrador')
    or public.fb_tem_perfil(p_pessoa, 'finance', p_entidade)
    or public.fb_tem_perfil(p_pessoa, 'leitura', p_entidade)
    or (p_cc is not null and public.fb_aprova(p_pessoa, p_bu, p_cc, p_produto, p_categoria))
    or (p_submetido_por is not null and p_submetido_por = p_pessoa)
  )
$$;

-- Liga a conta de login à ficha da pessoa. Só entra quem estiver registado, ativo e com "pode entrar".
create or replace function public.fb_ligar_utilizador()
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_id uuid;
begin
  if auth.uid() is null or v_email = '' then
    return false;
  end if;
  select id into v_id from public.pessoas
  where lower(email) = v_email and ativa and pode_entrar
    and (auth_user_id is null or auth_user_id = auth.uid());
  if v_id is null then
    return false;
  end if;
  update public.pessoas set auth_user_id = auth.uid() where id = v_id and auth_user_id is null;
  return true;
end
$$;

-- Resumo do que uma pessoa pode ver (usado no início e em "Ver como")
create or replace function public.fb_resumo_acessos_interno(p_pessoa uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'pessoa', (select jsonb_build_object('id', id, 'nome', nome, 'email', email) from public.pessoas where id = p_pessoa),
    'perfis', coalesce((
      select jsonb_agg(jsonb_build_object('perfil', pf.perfil, 'entidade', e.codigo) order by pf.perfil)
      from public.perfis pf left join public.entidades e on e.id = pf.entidade_id
      where pf.pessoa_id = p_pessoa and pf.desde <= current_date and (pf.ate is null or pf.ate >= current_date)
    ), '[]'::jsonb),
    'aprova', coalesce((
      select jsonb_agg(distinct jsonb_build_object('familia', r.bu_familia, 'cc', r.cc, 'papel', a.papel))
      from public.regras_owner r join public.regra_aprovadores a on a.regra_id = r.id
      where a.pessoa_id = p_pessoa and r.desde <= current_date and (r.ate is null or r.ate >= current_date)
    ), '[]'::jsonb),
    'acesso_salarial', exists (
      select 1 from public.acesso_salarial s
      where s.pessoa_id = p_pessoa and s.desde <= current_date and (s.ate is null or s.ate >= current_date)
    )
  )
$$;
revoke all on function public.fb_resumo_acessos_interno(uuid) from public, anon, authenticated;

create or replace function public.fb_meus_acessos()
returns jsonb language sql stable security definer set search_path = public as $$
  select public.fb_resumo_acessos_interno(public.fb_pessoa_atual())
$$;

-- "Ver como": só administradores; só leitura; cada uso fica registado
create or replace function public.fb_ver_como(p_alvo uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := public.fb_pessoa_atual();
  v_docs jsonb;
begin
  if not public.fb_is_admin(v_eu) then
    raise exception 'Só administradores podem usar "Ver como".' using errcode = '42501';
  end if;
  insert into public.auditoria (tabela, registo_id, acao, pessoa_id, auth_user_id)
  values ('ver_como', p_alvo::text, 'VER_COMO', v_eu, auth.uid());
  select coalesce(jsonb_agg(to_jsonb(d) - 'submetido_por' order by d.data_documento desc), '[]'::jsonb) into v_docs
  from public.documentos d
  where public.fb_pode_ver_documento(p_alvo, d.entidade_id, d.bu, d.cc, d.produto, d.categoria, d.submetido_por);
  return public.fb_resumo_acessos_interno(p_alvo) || jsonb_build_object('documentos', v_docs);
end
$$;

-- Valida uma classificação contra as listas do CdG (caminho aberto).
-- Devolve a lista de problemas; vazia = caminho válido.
create or replace function public.fb_validar_caminho(
  p_entidade uuid, p_bu text, p_produto text, p_cc text, p_categoria text, p_detalhe text, p_tipo text)
returns text[] language plpgsql stable security definer set search_path = public as $$
declare
  v text[] := '{}';
begin
  if not exists (select 1 from public.cdg_bu where codigo = p_bu and ativo) then
    v := v || format('A BU %s não existe ou está inativa', p_bu);
  end if;
  if not exists (select 1 from public.cdg_entidade_bu where entidade_id = p_entidade and bu = p_bu) then
    v := v || format('A BU %s não está aberta para esta entidade', p_bu);
  end if;
  if not exists (select 1 from public.cdg_produto where bu = p_bu and produto = p_produto and ativo) then
    v := v || format('O produto %s não existe na BU %s', p_produto, p_bu);
  end if;
  if not exists (select 1 from public.cdg_cc where bu = p_bu and produto = p_produto and cc = p_cc and ativo) then
    v := v || format('O CC %s não está aberto em %s / %s', p_cc, p_bu, p_produto);
  end if;
  if not exists (select 1 from public.cdg_categoria where cc = p_cc and categoria = p_categoria and ativo) then
    v := v || format('A categoria %s não existe no CC %s', p_categoria, p_cc);
  end if;
  if not exists (select 1 from public.cdg_detalhe where categoria = p_categoria and detalhe = p_detalhe and ativo) then
    v := v || format('O detalhe %s não existe na categoria %s', p_detalhe, p_categoria);
  end if;
  if not exists (select 1 from public.cdg_tipo where detalhe = p_detalhe and tipo = p_tipo and ativo) then
    v := v || format('O tipo %s não corresponde ao detalhe %s', p_tipo, p_detalhe);
  end if;
  return v;
end
$$;

-- ─────────────────────────────────────────────────────────────
-- 8. Registo de alterações (trigger) e proteção do último administrador
-- ─────────────────────────────────────────────────────────────
create or replace function public.fb_auditar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_id text;
begin
  v_id := coalesce(
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id',
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'codigo');
  insert into public.auditoria (tabela, registo_id, acao, antes, depois, pessoa_id, auth_user_id)
  values (tg_table_name, v_id, tg_op,
          case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
          public.fb_pessoa_atual(), auth.uid());
  return coalesce(new, old);
end
$$;

do $$
declare t text;
begin
  foreach t in array array['entidades','contas_bancarias','caixas_faturas','cdg_bu','cdg_entidade_bu','cdg_produto',
    'cdg_cc','cdg_categoria','cdg_detalhe','cdg_tipo','cdg_projeto','pessoas','perfis','acesso_salarial',
    'regras_owner','regra_aprovadores','documentos']
  loop
    execute format('create trigger auditar after insert or update or delete on public.%I
                    for each row execute function public.fb_auditar()', t);
  end loop;
end $$;

create or replace function public.fb_proteger_ultimo_admin()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_restantes int;
begin
  select count(*) into v_restantes
  from public.perfis pf join public.pessoas p on p.id = pf.pessoa_id
  where pf.perfil = 'administrador' and p.ativa
    and pf.desde <= current_date and (pf.ate is null or pf.ate >= current_date);
  if v_restantes = 0 then
    raise exception 'Tem de ficar pelo menos um administrador ativo.' using errcode = '23514';
  end if;
  return null;
end
$$;

create constraint trigger proteger_ultimo_admin_perfis
  after update or delete on public.perfis
  deferrable initially deferred
  for each row execute function public.fb_proteger_ultimo_admin();

create constraint trigger proteger_ultimo_admin_pessoas
  after update on public.pessoas
  deferrable initially deferred
  for each row execute function public.fb_proteger_ultimo_admin();

-- Desativar uma pessoa tira-lhe o acesso de imediato
create or replace function public.fb_ao_desativar()
returns trigger language plpgsql as $$
begin
  if old.ativa and not new.ativa then
    new.desativada_em := now();
    new.pode_entrar := false;
  elsif not old.ativa and new.ativa then
    new.desativada_em := null;
  end if;
  return new;
end
$$;
create trigger ao_desativar before update on public.pessoas
  for each row execute function public.fb_ao_desativar();

-- ─────────────────────────────────────────────────────────────
-- 9. Row Level Security
-- ─────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['entidades','contas_bancarias','caixas_faturas','cdg_bu','cdg_entidade_bu','cdg_produto',
    'cdg_cc','cdg_categoria','cdg_detalhe','cdg_tipo','cdg_projeto','pessoas','perfis','acesso_salarial',
    'regras_owner','regra_aprovadores','documentos','auditoria']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Listas de referência: qualquer utilizador ativo lê
do $$
declare t text;
begin
  foreach t in array array['entidades','caixas_faturas','cdg_bu','cdg_entidade_bu','cdg_produto','cdg_cc',
    'cdg_categoria','cdg_detalhe','cdg_tipo','cdg_projeto','regras_owner','regra_aprovadores']
  loop
    execute format('create policy ler on public.%I for select to authenticated using (public.fb_pessoa_atual() is not null)', t);
  end loop;
end $$;

-- Configuração geral: só administradores alteram
do $$
declare t text;
begin
  foreach t in array array['entidades','caixas_faturas','contas_bancarias','regras_owner','regra_aprovadores',
    'pessoas','perfis','acesso_salarial']
  loop
    execute format('create policy admin_insere on public.%I for insert to authenticated with check (public.fb_is_admin())', t);
    execute format('create policy admin_altera on public.%I for update to authenticated using (public.fb_is_admin()) with check (public.fb_is_admin())', t);
    execute format('create policy admin_apaga on public.%I for delete to authenticated using (public.fb_is_admin())', t);
  end loop;
end $$;

-- Listas do CdG: administradores e Finance alteram
do $$
declare t text;
begin
  foreach t in array array['cdg_bu','cdg_entidade_bu','cdg_produto','cdg_cc','cdg_categoria','cdg_detalhe','cdg_tipo','cdg_projeto']
  loop
    execute format('create policy finance_insere on public.%I for insert to authenticated with check (public.fb_is_finance())', t);
    execute format('create policy finance_altera on public.%I for update to authenticated using (public.fb_is_finance()) with check (public.fb_is_finance())', t);
    execute format('create policy finance_apaga on public.%I for delete to authenticated using (public.fb_is_finance())', t);
  end loop;
end $$;

-- Contas bancárias: administradores, Finance e Leitura (na entidade)
create policy ler on public.contas_bancarias for select to authenticated using (
  public.fb_is_admin()
  or public.fb_tem_perfil(public.fb_pessoa_atual(), 'finance', entidade_id)
  or public.fb_tem_perfil(public.fb_pessoa_atual(), 'leitura', entidade_id));

-- Pessoas: administradores e Finance veem todas; cada um vê a sua ficha
create policy ler on public.pessoas for select to authenticated using (
  public.fb_is_finance() or id = public.fb_pessoa_atual());

-- Perfis: administradores veem todos; cada um vê os seus
create policy ler on public.perfis for select to authenticated using (
  public.fb_is_admin() or pessoa_id = public.fb_pessoa_atual());

-- Acesso salarial: só administradores veem a lista
create policy ler on public.acesso_salarial for select to authenticated using (public.fb_is_admin());

-- Documentos
create policy ler on public.documentos for select to authenticated using (
  public.fb_pode_ver_documento(public.fb_pessoa_atual(), entidade_id, bu, cc, produto, categoria, submetido_por));
create policy finance_insere on public.documentos for insert to authenticated with check (
  public.fb_is_finance(null, entidade_id));
create policy finance_altera on public.documentos for update to authenticated
  using (public.fb_is_finance(null, entidade_id)) with check (public.fb_is_finance(null, entidade_id));
create policy admin_apaga on public.documentos for delete to authenticated using (public.fb_is_admin());

-- Registo de alterações: só administradores leem; ninguém escreve diretamente
create policy ler on public.auditoria for select to authenticated using (public.fb_is_admin());

-- Funções chamáveis pela app (o resto fica fechado a chamadas diretas)
revoke execute on function public.fb_ligar_utilizador(), public.fb_meus_acessos(), public.fb_ver_como(uuid),
  public.fb_validar_caminho(uuid, text, text, text, text, text, text) from public, anon;
grant execute on function public.fb_ligar_utilizador() to authenticated;
grant execute on function public.fb_meus_acessos() to authenticated;
grant execute on function public.fb_ver_como(uuid) to authenticated;
grant execute on function public.fb_validar_caminho(uuid, text, text, text, text, text, text) to authenticated;
