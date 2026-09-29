-- Finance Brain · S1.1 · Documentos fictícios, só para a base de dados de testes.
-- Servem para provar os acessos (critério de feito do S1.1). Fornecedores e números inventados.
begin;

insert into public.documentos
  (entidade_id, caixa_id, tipo_documento, numero, fornecedor_nome, fornecedor_nif, data_documento, valor_total,
   bu, produto, cc, categoria, detalhe, tipo, projeto, contraparte, link, estado)
select e.id, c.id, v.tipo_documento, v.numero, v.fornecedor, v.nif, v.data::date, v.valor,
       v.bu, v.produto, v.cc, v.categoria, v.detalhe, v.tipo, v.projeto, v.fornecedor, 'https://exemplo.invalid/' || v.numero, v.estado
from (values
  ('TOP',   'admin@tumo.pt',          'fatura', 'TESTE-001', 'Contabilidade Exemplo, Lda',  '500000001', '2026-09-02', 1845.00, 'Shared_Services_26', 'General', 'Finance_and_Legal',       'Accounting_and_Audit',   'Accounting',           'OPEX', null,      'por_aprovar'),
  ('TOP',   'admin@tumo.pt',          'fatura', 'TESTE-002', 'Limpezas Exemplo, SA',        '500000002', '2026-09-05',  980.40, 'TUMO_2627',          'Lisboa',  'Facilities_and_IT',       'Cleaning_and_Hygiene',   'Cleaning Services',    'OPEX', 'Lisboa',  'por_aprovar'),
  ('TOP',   'admin@tumo.pt',          'fatura', 'TESTE-003', 'Eletricidade Exemplo, SA',    '500000003', '2026-09-08', 2310.77, 'TUMO_2627',          'Porto',   'Facilities_and_IT',       'Space_Usage',            'Electricity',          'OPEX', 'Porto',   'aprovado'),
  ('TOP',   'admin@tumo.pt',          'fatura', 'TESTE-004', 'Gráfica Exemplo, Lda',        '500000004', '2026-09-10',  615.00, 'TUMO_2627',          'Coimbra', 'Marketing_and_Admissions','Promotion_Activities',   'Promotion Materials',  'OPEX', 'Coimbra', 'por_aprovar'),
  ('TOP',   'admin@tumo.pt',          'fatura', 'TESTE-005', 'Formadores Exemplo, Lda',     '500000005', '2026-09-12', 3200.00, 'TUMO_2627',          'General', 'TUMO_Program_Ops',        'Ed_Staff_Training',      'Armenia Training Fees','OPEX', null,      'por_aprovar'),
  ('TOP',   'admin@tumo.pt',          'fatura', 'TESTE-006', 'Finanças (coima exemplo)',    '600000001', '2026-09-15',  150.00, 'TUMO_2627',          'Portugal','General_Taxes',           'Taxes',                  'Fines',                'OPEX', null,      'por_classificar'),
  ('101010','admin@42lisboa.com',     'fatura', 'TESTE-007', 'Informática Exemplo, Lda',    '500000006', '2026-09-03', 4120.00, 'School_42_26',       'Lisboa',  'Facilities_and_IT',       'Space_Equipment',        'Furniture',            'CAPEX','Lisboa',  'por_aprovar'),
  ('101010','admin@42lisboa.com',     'fatura', 'TESTE-008', 'Catering Exemplo, Lda',       '500000007', '2026-09-09',  890.00, 'School_42_26',       'General', 'School_42_Program_Ops',   'Piscines',               'Coffee and Snacks',    'OPEX', null,      'por_aprovar'),
  ('101010','admin@42lisboa.com',     'fatura', 'TESTE-009', 'Advogados Exemplo, SP',       '500000008', '2026-09-11', 1230.00, 'School_42_26',       'General', 'Finance_and_Legal',       'Legal_and_Regulatory',   'Legal Support',        'OPEX', null,      'por_aprovar'),
  ('101010','admin@shakenfutures.pt', 'fatura', 'TESTE-010', 'Viagens Exemplo, Lda',        '500000009', '2026-09-14', 2780.00, 'Shaken_Futures_2627','Evora',   'Shaken_Future_Ops',       'Program_Coordination',   'Travel & Represent',   'OPEX', 'Évora - Acelerador', 'por_aprovar'),
  ('ACAD',  'admin@shakenacademy.pt', 'fatura', 'TESTE-011', 'Formação Exemplo, Lda',       '500000010', '2026-09-04', 1500.00, 'Professional_Programs_26','AI Dive','Professional_Programs_Ops','Programs_Facilitator','Base Compensation',    'OPEX', null,      'por_aprovar'),
  ('ACAD',  'admin@shakenfutures.pt', 'fatura', 'TESTE-012', 'Salas Exemplo, SA',           '500000011', '2026-09-16',  450.00, 'Shaken_Futures_2627','Taster Programs','Shaken_Future_Ops', 'Program_Activities',     'Venue Rental',         'OPEX', null,      'por_aprovar'),
  ('SNS',   'admin@shaken.pt',        'fatura', 'TESTE-013', 'Auditores Exemplo, SROC',     '500000012', '2026-09-06', 3690.00, 'Shared_Services_26', 'General', 'Finance_and_Legal',       'Accounting_and_Audit',   'Auditing',             'OPEX', null,      'por_aprovar'),
  ('SNS',   'admin@shaken.pt',        'fatura', 'TESTE-014', 'Software RH Exemplo, SL',     'ESB0000001','2026-09-18',  420.00, 'Shared_Services_26', 'General', 'People',                  'HR_Management',          'HR Software',          'OPEX', null,      'por_aprovar'),
  ('ES',    'admin@tumo.es',          'fatura', 'TESTE-015', 'Limpiezas Ejemplo, SL',       'ESB0000002','2026-09-07', 1120.00, 'TUMO_2627',          'Bilbao',  'Facilities_and_IT',       'Cleaning_and_Hygiene',   'Cleaning Services',    'OPEX', null,      'por_aprovar'),
  ('ES',    'admin@tumo.es',          'fatura', 'TESTE-016', 'Asesoría Ejemplo, SL',        'ESB0000003','2026-09-13',  780.00, 'TUMO_2627',          'Bilbao',  'Finance_and_Legal',       'Accounting_and_Audit',   'Accounting',           'OPEX', null,      'por_aprovar'),
  ('ES',    'admin@tumo.es',          'nota_credito','TESTE-017','Limpiezas Ejemplo, SL',   'ESB0000002','2026-09-20', -120.00, 'TUMO_2627',          'Bilbao',  'Facilities_and_IT',       'Cleaning_and_Hygiene',   'Cleaning Services',    'OPEX', null,      'por_aprovar')
) as v(ent, caixa, tipo_documento, numero, fornecedor, nif, data, valor, bu, produto, cc, categoria, detalhe, tipo, projeto, estado)
join public.entidades e on e.codigo = v.ent
left join public.caixas_faturas c on c.email = v.caixa;

commit;
