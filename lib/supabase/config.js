// Endereço e chave pública do Supabase. São públicos por natureza (a segurança está nas regras da base de dados).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_CONFIGURADO = Boolean(SUPABASE_URL && SUPABASE_KEY);
