import Pagina from "@/components/Pagina";
import Mensagens from "@/components/Mensagens";
import { exigirConfig } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { voltar, txt, ontem } from "@/lib/acoes";

export const metadata = { title: "Owners · Finance Brain" };
const P = "/config/owners";

async function novaRegra(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { data: regra, error } = await supabase.from("regras_owner").insert({
    bu_familia: txt(fd, "bu_familia"), cc: txt(fd, "cc"), produto: txt(fd, "produto"), categoria: txt(fd, "categoria"),
    desde: txt(fd, "desde") ?? undefined, notas: txt(fd, "notas"),
  }).select("id").single();
  if (error) voltar(P, error);
  const linhas = [{ regra_id: regra.id, pessoa_id: fd.get("aprovador"), papel: "aprovador" }];
  if (txt(fd, "substituto") && fd.get("substituto") !== fd.get("aprovador")) {
    linhas.push({ regra_id: regra.id, pessoa_id: fd.get("substituto"), papel: "substituto" });
  }
  const { error: e2 } = await supabase.from("regra_aprovadores").insert(linhas);
  voltar(P, e2, "Regra criada.");
}

async function terminarRegra(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("regras_owner").update({ ate: ontem() }).eq("id", fd.get("id"));
  voltar(P, error, "Regra terminada. Fica no histórico.");
}

async function juntarPessoa(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("regra_aprovadores").insert({ regra_id: fd.get("id"), pessoa_id: fd.get("pessoa_id"), papel: fd.get("papel") });
  voltar(P, error, "Pessoa acrescentada à regra.");
}

async function tirarPessoa(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("regra_aprovadores").delete().eq("regra_id", fd.get("id")).eq("pessoa_id", fd.get("pessoa_id"));
  voltar(P, error, "Pessoa retirada da regra.");
}

const hojeISO = () => new Date().toISOString().slice(0, 10);
const emVigor = (r) => r.desde <= hojeISO() && (!r.ate || r.ate >= hojeISO());

export default async function Owners({ searchParams }) {
  const sessao = await exigirConfig();
  const sp = await searchParams;
  const { supabase } = sessao;
  const [{ data: regras }, { data: aprov }, { data: pessoas }, { data: bus }, { data: ccs }] = await Promise.all([
    supabase.from("regras_owner").select("*").order("bu_familia").order("cc"),
    supabase.from("regra_aprovadores").select("*"),
    supabase.from("pessoas").select("id,nome,ativa").order("nome"),
    supabase.from("cdg_bu").select("codigo,familia,ativo"),
    supabase.from("cdg_cc").select("bu,cc,ativo").eq("ativo", true),
  ]);
  const nome = Object.fromEntries((pessoas ?? []).map((p) => [p.id, p.nome]));
  const ativas = (pessoas ?? []).filter((p) => p.ativa);
  const porRegra = {};
  (aprov ?? []).forEach((a) => { (porRegra[a.regra_id] ??= []).push(a); });
  const vigentes = (regras ?? []).filter(emVigor);
  const passadas = (regras ?? []).filter((r) => !emVigor(r));

  // Combinações família × CC em uso que não têm regra em vigor (receita e Ignore não precisam)
  const familiaDe = Object.fromEntries((bus ?? []).filter((b) => b.ativo).map((b) => [b.codigo, b.familia]));
  const combos = new Set();
  (ccs ?? []).forEach((c) => {
    const f = familiaDe[c.bu];
    if (f && c.cc !== "Income_Sources" && f !== "Ignore") combos.add(`${f}|${c.cc}`);
  });
  const cobertas = new Set(vigentes.filter((r) => !r.produto && !r.categoria).map((r) => `${r.bu_familia}|${r.cc}`));
  const semOwner = [...combos].filter((k) => !cobertas.has(k)).sort().map((k) => k.split("|"));
  const familias = [...new Set(Object.values(familiaDe))].filter((f) => f !== "Ignore").sort();
  const listaCC = [...new Set((ccs ?? []).map((c) => c.cc))].sort();

  return (
    <Pagina sessao={sessao}>
      <h1>Owners de centro de custo</h1>
      <p className="muted">Hoje a aprovação é por família de BU × CC. Sem regra, o documento vai para a fila do Finance. Mudar de owner: termina-se a regra antiga e cria-se uma nova, para o histórico mostrar quem era owner em cada data.</p>
      <Mensagens sp={sp} />

      <h2>Sem owner ({semOwner.length})</h2>
      {semOwner.length === 0 ? <p className="muted">Todas as combinações em uso têm owner.</p> : (
        <div className="chips">{semOwner.map(([f, c]) => <span key={f + c} className="chip warn">{f} × {c}</span>)}</div>
      )}

      <h2>Nova regra</h2>
      <form action={novaRegra} className="linha">
        <label>Família de BU<select name="bu_familia" required>{familias.map((f) => <option key={f}>{f}</option>)}</select></label>
        <label>Centro de custo<select name="cc" required>{listaCC.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Aprovador<select name="aprovador" required>{ativas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
        <label>Substituto (opcional)<select name="substituto" defaultValue=""><option value="">—</option>{ativas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
        <label>Desde<input type="date" name="desde" /></label>
        <label>Notas<input name="notas" /></label>
        <button className="btn btn-primario">Criar regra</button>
      </form>

      <h2>Regras em vigor ({vigentes.length})</h2>
      <div className="tbl">
        <table>
          <thead><tr><th>Família</th><th>CC</th><th>Aprovadores</th><th>Substituto</th><th>Desde</th><th>Acrescentar pessoa</th><th></th></tr></thead>
          <tbody>
            {vigentes.map((r) => {
              const pes = porRegra[r.id] ?? [];
              return (
                <tr key={r.id}>
                  <td>{r.bu_familia}{r.produto ? ` · ${r.produto}` : ""}{r.categoria ? ` · ${r.categoria}` : ""}</td>
                  <td>{r.cc}</td>
                  {["aprovador", "substituto"].map((papel) => (
                    <td key={papel}>
                      {pes.filter((a) => a.papel === papel).map((a) => (
                        <form key={a.pessoa_id} action={tirarPessoa} className="inline" style={{ display: "block" }}>
                          <input type="hidden" name="id" value={r.id} /><input type="hidden" name="pessoa_id" value={a.pessoa_id} />
                          {nome[a.pessoa_id] ?? "?"} <button className="btn btn-pequeno" aria-label={`Retirar ${nome[a.pessoa_id]}`}>×</button>
                        </form>
                      ))}
                    </td>
                  ))}
                  <td>{r.desde}</td>
                  <td>
                    <form action={juntarPessoa} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <select name="pessoa_id" aria-label="Pessoa">{ativas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>{" "}
                      <select name="papel" aria-label="Papel"><option value="aprovador">aprovador</option><option value="substituto">substituto</option></select>{" "}
                      <button className="btn btn-pequeno">+</button>
                    </form>
                  </td>
                  <td>
                    <form action={terminarRegra} className="inline"><input type="hidden" name="id" value={r.id} /><button className="btn btn-pequeno">Terminar</button></form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {passadas.length > 0 && (
        <>
          <h2>Regras terminadas ({passadas.length})</h2>
          <div className="tbl">
            <table>
              <thead><tr><th>Família</th><th>CC</th><th>Pessoas</th><th>Desde</th><th>Até</th></tr></thead>
              <tbody>
                {passadas.map((r) => (
                  <tr key={r.id} className="inativo">
                    <td>{r.bu_familia}</td><td>{r.cc}</td>
                    <td>{(porRegra[r.id] ?? []).map((a) => `${nome[a.pessoa_id]} (${a.papel})`).join(", ")}</td>
                    <td>{r.desde}</td><td>{r.ate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Pagina>
  );
}
