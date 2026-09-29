"use client";
import { useState } from "react";
import { criarClienteBrowser } from "@/lib/supabase/client";

export default function FormLogin() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState(null);

  async function entrarGoogle() {
    const supabase = criarClienteBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: "select_account" } },
    });
  }

  async function enviarLink(e) {
    e.preventDefault();
    setEstado("a enviar");
    const supabase = criarClienteBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setEstado(error ? "erro" : "enviado");
  }

  return (
    <div className="login-form">
      <button type="button" className="btn btn-primario btn-largo" onClick={entrarGoogle}>
        Entrar com Google
      </button>
      <div className="separador"><span>ou</span></div>
      <form onSubmit={enviarLink} className="login-email">
        <label htmlFor="email">Receber um link de entrada por email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.pt" />
        <button type="submit" className="btn btn-largo" disabled={estado === "a enviar"}>Enviar link</button>
      </form>
      {estado === "enviado" && <p className="ok">Link enviado. Abre o email neste dispositivo.</p>}
      {estado === "erro" && <p className="aviso">Não foi possível enviar o link. Tenta de novo daqui a um minuto.</p>}
    </div>
  );
}
