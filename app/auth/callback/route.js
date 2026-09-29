import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

// O Google (ou o link por email) devolve aqui. Troca o código por sessão e confirma que a pessoa está registada.
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await criarClienteServidor();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?erro=link-invalido", url.origin));
  }
  const { data: ligado } = await supabase.rpc("fb_ligar_utilizador");
  if (!ligado) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?erro=sem-acesso", url.origin));
  }
  return NextResponse.redirect(new URL("/", url.origin));
}
