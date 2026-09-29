import { redirect } from "next/navigation";
import { criarClienteServidor } from "./supabase/server";

// Horas máximas desde a última entrada para mexer em configuração e perfis (D-027)
export const HORAS_REENTRADA = 12;

// Devolve { supabase, user, acessos } ou redireciona para o login.
export async function exigirSessao() {
  const supabase = await criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: acessos } = await supabase.rpc("fb_meus_acessos");
  if (!acessos?.pessoa) redirect("/auth/sair?erro=sem-acesso");
  const perfis = new Set((acessos.perfis ?? []).map((p) => p.perfil));
  return {
    supabase,
    user,
    acessos,
    isAdmin: perfis.has("administrador"),
    isFinance: perfis.has("finance") || perfis.has("administrador"),
  };
}

// Para páginas de configuração: exige o perfil e uma entrada recente.
export async function exigirConfig({ soAdmin = true } = {}) {
  const s = await exigirSessao();
  if (soAdmin ? !s.isAdmin : !s.isFinance) redirect("/?erro=sem-permissao");
  const ultima = s.user.last_sign_in_at ? new Date(s.user.last_sign_in_at) : null;
  if (!ultima || Date.now() - ultima.getTime() > HORAS_REENTRADA * 3600 * 1000) {
    redirect("/auth/sair?motivo=reentrar");
  }
  return s;
}
