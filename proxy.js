import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY, SUPABASE_CONFIGURADO } from "./lib/supabase/config";

// Renova a sessão em cada pedido e manda para o login quem não tem sessão.
export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const publico = pathname.startsWith("/login") || pathname.startsWith("/auth") || pathname.startsWith("/configurar");

  if (!SUPABASE_CONFIGURADO) {
    if (pathname.startsWith("/configurar")) return NextResponse.next();
    return NextResponse.redirect(new URL("/configurar", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !publico) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|svg|ico)$).*)"],
};
