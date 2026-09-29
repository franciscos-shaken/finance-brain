import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";

export const metadata = { title: "Ligação em falta · Finance Brain" };

export default function Configurar() {
  return (
    <main className="login">
      <div className="login-caixa">
        <h1>Finance Brain</h1>
        {SUPABASE_CONFIGURADO ? (
          <p className="ok">A ligação à base de dados está configurada. <a href="/">Entrar</a></p>
        ) : (
          <>
            <p className="aviso">Este ambiente ainda não está ligado à base de dados.</p>
            <p className="muted">Falta definir no Vercel as variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> e voltar a publicar.</p>
          </>
        )}
      </div>
    </main>
  );
}
