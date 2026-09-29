import Pagina from "@/components/Pagina";
import Mensagens from "@/components/Mensagens";
import { exigirConfig } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { voltar, txt } from "@/lib/acoes";

export const metadata = { title: "Entidades · Finance Brain" };
const P = "/config/entidades";

async function gravarEntidade(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("entidades").update({
    nome_legal: txt(fd, "nome_legal"),
    regime_iva: txt(fd, "regime_iva"),
    codigo_primavera: txt(fd, "codigo_primavera"),
    forma_obrigar: txt(fd, "forma_obrigar"),
    ativa_ate: txt(fd, "ativa_ate"),
  }).eq("id", fd.get("id"));
  voltar(P, error, "Entidade gravada.");
}

async function novaCaixa(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("caixas_faturas").insert({ email: txt(fd, "email")?.toLowerCase(), descricao: txt(fd, "descricao") });
  voltar(P, error, "Caixa acrescentada.");
}

async function alternarCaixa(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("caixas_faturas").update({ ativa: fd.get("ativa") !== "true" }).eq("id", fd.get("id"));
  voltar(P, error);
}

async function novaConta(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("contas_bancarias").insert({
    entidade_id: fd.get("entidade_id"), banco: txt(fd, "banco"), iban: txt(fd, "iban")?.replace(/\s+/g, "").toUpperCase(),
    bic: txt(fd, "bic"), descricao: txt(fd, "descricao"),
  });
  voltar(P, error, "Conta acrescentada.");
}

async function alternarConta(fd) {
  "use server";
  await exigirConfig();
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("contas_bancarias").update({ ativa: fd.get("ativa") !== "true" }).eq("id", fd.get("id"));
  voltar(P, error);
}

export default async function Entidades({ searchParams }) {
  const sessao = await exigirConfig();
  const sp = await searchParams;
  const { supabase } = sessao;
  const [{ data: entidades }, { data: caixas }, { data: contas }] = await Promise.all([
    supabase.from("entidades").select("*").order("codigo"),
    supabase.from("caixas_faturas").select("*").order("email"),
    supabase.from("contas_bancarias").select("*").order("banco"),
  ]);
  const cod = Object.fromEntries((entidades ?? []).map((e) => [e.id, e.codigo]));
  return (
    <Pagina sessao={sessao}>
      <h1>Entidades, contas e caixas</h1>
      <Mensagens sp={sp} />
      <h2>Entidades legais</h2>
      <div className="tbl">
        <table>
          <thead><tr><th>Código</th><th>Nome legal</th><th>NIF</th><th>País</th><th>Regime IVA</th><th>Código Primavera</th><th>Obriga-se com</th><th>Ativa até</th><th></th></tr></thead>
          <tbody>
            {(entidades ?? []).map((e) => (
              <tr key={e.id}>
                <td><code>{e.codigo}</code></td>
                <td colSpan={8}>
                  <form action={gravarEntidade} className="linha" style={{ margin: 0, border: 0, padding: 0 }}>
                    <input type="hidden" name="id" value={e.id} />
                    <input name="nome_legal" defaultValue={e.nome_legal} aria-label="Nome legal" size={30} />
                    <span className="muted">{e.nif} · {e.pais}</span>
                    <input name="regime_iva" defaultValue={e.regime_iva ?? ""} placeholder="Regime IVA" aria-label="Regime de IVA" size={12} />
                    <input name="codigo_primavera" defaultValue={e.codigo_primavera ?? ""} placeholder="Cód. Primavera" aria-label="Código Primavera" size={10} />
                    <input name="forma_obrigar" defaultValue={e.forma_obrigar ?? ""} placeholder="Obriga-se com" aria-label="Forma de obrigar" size={20} />
                    <input name="ativa_ate" type="date" defaultValue={e.ativa_ate ?? ""} aria-label="Ativa até" />
                    <button className="btn btn-pequeno">Gravar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Caixas de faturas</h2>
      <p className="muted">Uma caixa pode receber faturas de várias entidades; a entidade de cada fatura sai do NIF do comprador.</p>
      <div className="tbl">
        <table>
          <thead><tr><th>Email</th><th>Uso</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {(caixas ?? []).map((c) => (
              <tr key={c.id} className={c.ativa ? "" : "inativo"}>
                <td>{c.email}</td><td>{c.descricao}</td><td>{c.ativa ? "Ativa" : "Inativa"}</td>
                <td><form action={alternarCaixa} className="inline"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="ativa" value={String(c.ativa)} /><button className="btn btn-pequeno">{c.ativa ? "Desativar" : "Ativar"}</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={novaCaixa} className="linha">
        <label>Email<input name="email" type="email" required /></label>
        <label>Uso<input name="descricao" /></label>
        <button className="btn btn-primario">Acrescentar caixa</button>
      </form>

      <h2>Contas bancárias</h2>
      <p className="muted">Cada entidade pode ter várias contas. Entram com a tesouraria (S1.2).</p>
      <div className="tbl">
        <table>
          <thead><tr><th>Entidade</th><th>Banco</th><th>IBAN</th><th>BIC</th><th>Descrição</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {(contas ?? []).length === 0 && <tr><td colSpan={7} className="muted">Ainda sem contas.</td></tr>}
            {(contas ?? []).map((c) => (
              <tr key={c.id} className={c.ativa ? "" : "inativo"}>
                <td>{cod[c.entidade_id]}</td><td>{c.banco}</td><td><code>{c.iban}</code></td><td>{c.bic}</td><td>{c.descricao}</td><td>{c.ativa ? "Ativa" : "Inativa"}</td>
                <td><form action={alternarConta} className="inline"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="ativa" value={String(c.ativa)} /><button className="btn btn-pequeno">{c.ativa ? "Desativar" : "Ativar"}</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={novaConta} className="linha">
        <label>Entidade<select name="entidade_id" required>{(entidades ?? []).map((e) => <option key={e.id} value={e.id}>{e.codigo}</option>)}</select></label>
        <label>Banco<input name="banco" required /></label>
        <label>IBAN<input name="iban" required size={30} /></label>
        <label>BIC<input name="bic" size={12} /></label>
        <label>Descrição<input name="descricao" /></label>
        <button className="btn btn-primario">Acrescentar conta</button>
      </form>
    </Pagina>
  );
}
