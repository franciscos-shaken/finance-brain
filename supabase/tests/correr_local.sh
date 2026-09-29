#!/usr/bin/env bash
# Corre a migração, os dados de teste e os testes de acessos num Postgres local (não no Supabase).
# Uso: PGHOST=/tmp/pg PGPORT=5433 bash supabase/tests/correr_local.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
P="psql -U postgres -v ON_ERROR_STOP=1 -q -X"
psql -U postgres -qX -c "drop database if exists fbtest" -c "create database fbtest"
for f in supabase/tests/00_stub_supabase_local.sql supabase/migrations/*.sql \
         supabase/seed/01_estrutura.sql supabase/seed/02_pessoas_teste.sql supabase/seed/03_documentos_teste.sql; do
  $P -d fbtest -f "$f" > /dev/null
done
$P -d fbtest -t -f supabase/tests/01_acessos.sql 2>&1 | grep -E "ok |FALHOU|ERROR|PASSARAM" | sed 's/^.*NOTICE:  //'
