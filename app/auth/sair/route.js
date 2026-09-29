import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export async function GET(request) {
  const url = new URL(request.url);
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  const destino = new URL("/login", url.origin);
  const erro = url.searchParams.get("erro");
  const motivo = url.searchParams.get("motivo");
  if (erro) destino.searchParams.set("erro", erro);
  if (motivo) destino.searchParams.set("motivo", motivo);
  return NextResponse.redirect(destino);
}
