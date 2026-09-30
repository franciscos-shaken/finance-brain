import Pagina from "@/components/Pagina";
import Mensagens from "@/components/Mensagens";
import { exigirConfig } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { voltar, txt, ontem } from "@/lib/acoes";

export const metadata = { title: "Pessoas e perfis · Finance Brain" };
const P = "/config/pessoas";
const PERFIS = [["administrador", "Administrador"], ["finance", "Finance"], ["leitura", "Leitura"], ["colaborador", "Colaborador"]];
const nomePerfil = Object.fromEntries(PERFIS);

async function novaPessoa(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("pessoas").insert({
    nome: txt(fd, "nome"), email: txt(fd, "email")?.toLowerCase(), funcao: txt(fd, "funcao"),
    entidade_id: txt(fd, "entidade_id"), pode_entrar: fd.get("pode_entrar") === "on",
  });
  voltar(P, error, "Pessoa acrescentada.");
}

async function alternar(fd) {
  "use server";
  await exigirConfig();
  const campo = fd.get("campo");
  if (!["ativa", "pode_entrar"].includes(campo)) return;
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("pessoas").update({ [campo]: fd.get("valor") !== "true" }).eq("id", fd.get("id"));
  voltar(P, error);
}

async function novoPerfil(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("perfis").insert({ pessoa_id: fd.get("pessoa_id"), perfil: fd.get("perfil"), entidade_id: txt(fd, "entidade_id") });
  voltar(P, error, "Perfil atribuído.");
}

async function terminarPerfil(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("perfis").update({ ate: ontem() }).eq("id", fd.get("id"));
  voltar(P, error, "Perfil terminado.");
}

async function reporPerfil(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("perfis").update({ ate: null }).eq("id", fd.get("id"));
  voltar(P, error, "Perfil reposto.");
}

async function acessoSalarial(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = fd.get("acao") === "dar"
    ? await supabase.from("acesso_salarial").insert({ pessoa_id: fd.get("pessoa_id") })
    : await supabase.from("acesso_salarial").update({ ate: ontem() }).eq("pessoa_id", fd.get("pessoa_id")).is("ate", null);
  voltar(P, error, fd.get("acao") === "dar" ? "Acesso salarial dado." : "Acesso salarial retirado.");
}

const hojeISO = () => new Date().toISOString().slice(0, 10);
const emVigor = (r) => r.desde <= hojeISO() && (!r.ate || r.ate >= hojeISO());

export default async function Pessoas({ searchParams }) {
  const sessao = await exigirConfig();
  const sp = await searchParams;
  const { supabase } = sessao;
  const [{ data: pessoas }, { data: perfis }, { data: entidades }, { data: salarial }] = await Promise.all([
    supabase.from("pessoas").select("*").order("nome"),
    supabase.from("perfis").select("*").order("desde"),
    supabase.from("entidades").select("id,codigo").order("codigo"),
    supabase.from("acesso_salarial").select("*"),
  ]);
  const cod = Object.fromEntries((entidades ?? []).map((e) => [e.id, e.codigo]));
  const perfisDe = {};
  (perfis ?? []).forEach((p) => { (perfisDe[p.pessoa_id] ??= []).push(p); });
  const temSalarial = new Set((salarial ?? []).filter(emVigor).map((s) => s.pessoa_id));

  return (
    <Pagina sessao={sessao}>
      <h1>Pessoas e perfis</h1>
      <p className="muted">"Pode entrar" controla o login. Desativar uma pessoa tira-lhe o acesso de imediato e guarda o histórico. O acesso a dados salariais é dado à parte e nenhum perfil o inclui. Quem não tem perfil só vê os documentos que aprova como owner.</p>
      <Mensagens sp={sp} />
      <div className="tbl">
        <table>
          <thead><tr><th>Nome</th><th>Email</th><th>Entidade</th><th>Estado</th><th>Pode entrar</th><th>Perfis atuais</th><th>Acrescentar perfil</th><th>Salarial</th></tr></thead>
          <tbody>
            {(pessoas ?? []).map((p) => (
              <tr key={p.id} className={p.ativa ? "" : "inativo"}>
                <td>{p.nome}<div className="muted" style={{ fontSize: ".8rem" }}>{p.funcao}</div></td>
                <td>{p.email}{p.auth_user_id && <div className="muted" style={{ fontSize: ".75rem" }}>já entrou</div>}</td>
                <td>{cod[p.entidade_id] ?? "—"}</td>
                <td>
                  <form action={alternar} className="inline"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="campo" value="ativa" /><input type="hidden" name="valor" value={String(p.ativa)} />
                    {p.ativa ? "Ativa" : "Inativa"} <button className="btn btn-pequeno">{p.ativa ? "Desativar" : "Reativar"}</button></form>
                </td>
                <td>
                  <form action={alternar} className="inline"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="campo" value="pode_entrar" /><input type="hidden" name="valor" value={String(p.pode_entrar)} />
                    {p.pode_entrar ? "Sim" : "Não"} <button className="btn btn-pequeno" disabled={!p.ativa}>{p.pode_entrar ? "Bloquear" : "Permitir"}</button></form>
                </td>
                <td>
                  {!(perfisDe[p.id] ?? []).length && <span className="muted">Sem perfil</span>}
                  {(perfisDe[p.id] ?? []).map((pf) => (
                    <div key={pf.id} style={{ whiteSpace: "nowrap" }}>
                      <span className={emVigor(pf) ? "chip" : "chip warn"}>{nomePerfil[pf.perfil]} · {pf.entidade_id ? cod[pf.entidade_id] : "todas"}{emVigor(pf) ? "" : ` · terminado ${pf.ate}`}</span>{" "}
                      {emVigor(pf) ? (
                        <form action={terminarPerfil} className="inline"><input type="hidden" name="id" value={pf.id} /><button className="btn btn-pequeno">Terminar</button></form>
                      ) : (
                        <form action={reporPerfil} className="inline"><input type="hidden" name="id" value={pf.id} /><button className="btn btn-pequeno">Repor</button></form>
                      )}
                    </div>
                  ))}
                </td>
                <td>
                  <form action={novoPerfil} className="inline">
                    <input type="hidden" name="pessoa_id" value={p.id} />
                    <select name="perfil" aria-label="Perfil a atribuir" required defaultValue=""><option value="" disabled>Escolher perfil…</option>{[...PERFIS].reverse().map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>{" "}
                    <select name="entidade_id" aria-label="Entidade"><option value="">Todas as entidades</option>{(entidades ?? []).map((e) => <option key={e.id} value={e.id}>{e.codigo}</option>)}</select>{" "}
                    <button className="btn btn-pequeno">Atribuir</button>
                  </form>
                </td>
                <td>
                  <form action={acessoSalarial} className="inline"><input type="hidden" name="pessoa_id" value={p.id} /><input type="hidden" name="acao" value={temSalarial.has(p.id) ? "tirar" : "dar"} />
                    {temSalarial.has(p.id) ? "Com acesso" : "Sem acesso"} <button className="btn btn-pequeno">{temSalarial.has(p.id) ? "Retirar" : "Dar"}</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Acrescentar pessoa</h2>
      <form action={novaPessoa} className="linha">
        <label>Nome<input name="nome" required /></label>
        <label>Email de trabalho (conta Google)<input name="email" type="email" required size={28} /></label>
        <label>Função<input name="funcao" /></label>
        <label>Entidade empregadora<select name="entidade_id"><option value="">—</option>{(entidades ?? []).map((e) => <option key={e.id} value={e.id}>{e.codigo}</option>)}</select></label>
        <label style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><input type="checkbox" name="pode_entrar" /> Pode entrar</label>
        <button className="btn btn-primario">Acrescentar</button>
      </form>
    </Pagina>
  );
}
