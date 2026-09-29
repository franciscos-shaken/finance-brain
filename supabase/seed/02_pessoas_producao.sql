-- Finance Brain · S1.1 · Pessoas, perfis e regras de owner (PRODUÇÃO: emails reais)
begin;

insert into public.pessoas (nome,email,funcao,pode_entrar) values
  ('Francisco Martins','fm@shaken.pt','CFO',true),
  ('Francisco Chichorro Ramos','fcr@shaken.pt','Finance',true),
  ('Liliana Moura Tavares','lt@shaken.pt','Finance',true),
  ('Miguel Serrão','ms@shaken.pt','Finance (controller)',true),
  ('Diogo Martins','dm@shaken.pt','Finance',true),
  ('João Churro','jc@shaken.pt','Finance',true),
  ('Rodrigo Nevoa','rn@shaken.pt','Facilities and IT',true),
  ('Luísa Castelo Branco','lcb@shaken.pt','People',true),
  ('Ana Roque Dantas','ard@shaken.pt','Data and Institution',true),
  ('Mafalda Furtado Mendonça','mfm@shaken.pt','Communication',true),
  ('Filipa Cunha','filipa.cunha@tumo.pt','TUMO',true),
  ('Vanessa Zdanowski','vz@42lisboa.com','42',true),
  ('Ana Charrua','acr@shaken.pt','Business Development / Rentals / Professional Programs',true),
  ('João Figueirinhas Costa','jfc@shakenfutures.pt','Shaken Futures',true),
  ('Rita Almeida Neves','rita.almeidaneves@tumo.pt','Marketing & Admissions TUMO',true),
  ('Filipa Lima','filipa.lima@shakenacademy.pt','Consulting Programs (nome deduzido do email — confirmar)',true);

insert into public.perfis (pessoa_id,perfil) select id,'administrador' from public.pessoas where email='fm@shaken.pt';
insert into public.perfis (pessoa_id,perfil) select id,'administrador' from public.pessoas where email='fcr@shaken.pt';
insert into public.perfis (pessoa_id,perfil) select id,'finance' from public.pessoas where email='lt@shaken.pt';
insert into public.perfis (pessoa_id,perfil) select id,'finance' from public.pessoas where email='ms@shaken.pt';
insert into public.perfis (pessoa_id,perfil) select id,'finance' from public.pessoas where email='dm@shaken.pt';
insert into public.perfis (pessoa_id,perfil) select id,'finance' from public.pessoas where email='jc@shaken.pt';

-- Regras de owner (família de BU × CC) com o aprovador e, se houver, o substituto
create temporary table _regras (bu_familia text, cc text, aprovador text, substituto text, papel_substituto text) on commit drop;
insert into _regras values
  ('Shared_Services','Communication','Mafalda Furtado Mendonça',null,null),
  ('Shared_Services','Data_and_Institution','Ana Roque Dantas',null,null),
  ('Shared_Services','Executive_Team','Francisco Martins',null,null),
  ('Shared_Services','Facilities_and_IT','Rodrigo Nevoa',null,null),
  ('Shared_Services','Finance_and_Legal','Francisco Martins','Francisco Chichorro Ramos','aprovador'),
  ('Shared_Services','People','Luísa Castelo Branco',null,null),
  ('TUMO','Communication','Mafalda Furtado Mendonça',null,null),
  ('TUMO','Data_and_Institution','Ana Roque Dantas',null,null),
  ('TUMO','Executive_Team','Francisco Martins',null,null),
  ('TUMO','Facilities_and_IT','Rodrigo Nevoa',null,null),
  ('TUMO','Finance_and_Legal','Francisco Martins','Francisco Chichorro Ramos','aprovador'),
  ('TUMO','Marketing_and_Admissions','Rita Almeida Neves',null,null),
  ('TUMO','People','Luísa Castelo Branco',null,null),
  ('TUMO','TUMO_HQ','Filipa Cunha',null,null),
  ('TUMO','TUMO_Program_Ops','Filipa Cunha',null,null),
  ('TUMO','Rental_Ops','Ana Charrua',null,null),
  ('School_42','Business_Development','Ana Charrua',null,null),
  ('School_42','Communication','Mafalda Furtado Mendonça',null,null),
  ('School_42','Data_and_Institution','Ana Roque Dantas',null,null),
  ('School_42','Executive_Team','Francisco Martins',null,null),
  ('School_42','Facilities_and_IT','Rodrigo Nevoa',null,null),
  ('School_42','Finance_and_Legal','Francisco Martins','Francisco Chichorro Ramos','aprovador'),
  ('School_42','Marketing_and_Admissions','Vanessa Zdanowski',null,null),
  ('School_42','People','Luísa Castelo Branco',null,null),
  ('School_42','Rental_Ops','Ana Charrua',null,null),
  ('School_42','School_42_Program_Ops','Vanessa Zdanowski',null,null),
  ('School_42','_42_HQ','Vanessa Zdanowski',null,null),
  ('School_42','SEA_ME_Program_Ops','Vanessa Zdanowski',null,null),
  ('Professional_Programs','Business_Development','Ana Charrua',null,null),
  ('Professional_Programs','Communication','Mafalda Furtado Mendonça',null,null),
  ('Professional_Programs','Data_and_Institution','Ana Roque Dantas',null,null),
  ('Professional_Programs','Facilities_and_IT','Rodrigo Nevoa',null,null),
  ('Professional_Programs','Finance_and_Legal','Francisco Martins','Francisco Chichorro Ramos','aprovador'),
  ('Professional_Programs','People','Luísa Castelo Branco',null,null),
  ('Professional_Programs','Professional_Programs_Ops','Ana Charrua',null,null),
  ('Professional_Programs','Rental_Ops','Ana Charrua',null,null),
  ('Consulting_Programs','Consulting_Programs_Ops','Filipa Lima',null,null),
  ('Shaken_Futures','Shaken_Future_Ops','João Figueirinhas Costa',null,null),
  ('Shaken_Futures','Facilities_and_IT','Rodrigo Nevoa',null,null),
  ('Shaken_Futures','Finance_and_Legal','Francisco Martins','Francisco Chichorro Ramos','aprovador'),
  ('International','Finance_and_Legal','Francisco Martins','Francisco Chichorro Ramos','aprovador');
insert into public.regras_owner (bu_familia, cc, notas)
select bu_familia, cc, 'Valor inicial (Owners_BUxCC_v3)' from _regras;
insert into public.regra_aprovadores (regra_id, pessoa_id, papel)
select r.id, p.id, 'aprovador' from _regras t
join public.regras_owner r on r.bu_familia = t.bu_familia and r.cc = t.cc
join public.pessoas p on p.nome = t.aprovador;
insert into public.regra_aprovadores (regra_id, pessoa_id, papel)
select r.id, p.id, t.papel_substituto from _regras t
join public.regras_owner r on r.bu_familia = t.bu_familia and r.cc = t.cc
join public.pessoas p on p.nome = t.substituto
where t.substituto is not null;

commit;
