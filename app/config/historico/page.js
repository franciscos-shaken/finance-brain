import Link from "next/link";
import Pagina from "@/components/Pagina";
import { exigirConfig } from "@/lib/sessao";

export const metadata = { title: "Histórico · Finance Brain" };
const ACOES = { INSERT: "Criou", UPDATE: "Alterou", DELETE: "Apagou", VER_COMO: "Viu como" };

function mudancas(a) {
  if (a.acao === "UPDATE" && a.antes && a.depois) {
    return Object.keys(a.depois).filter((k) => JSON.stringify(a.antes[k]) !== JSON.stringify(a.depois[k]))
      .map((k) => `${k}: ${JSON.stringify(a.antes[k])} → ${JSON.stringify(a.depois[k])}`).join("; ");
  }
  const d = a.depois ?? a.antes;
  if (!d) return "";
  return ["codigo", "nome", "email", "bu", "produto", "cc", "categoria", "detalhe", "tipo", "perfil", "bu_familia", "papel", "numero"]
    .filter((k) => d[k] != null).map((k) => `${k}: ${d[k]}`).join(" · ");
}

export default async function Historico({ searchParams }) {
  const sessao = await exigirConfig();
  const sp = await searchParams;
  const { supabase } = sessao;
  let q = supabase.from("auditoria").select("*").order("em", { ascending: false }).limit(300);
  if (sp?.tabela) q = q.eq("tabela", sp.tabela);
  const [{ data: linhas, error }, { data: pessoas }] = await Promise.all([q, supabase.from("pessoas").select("id,nome")]);
  const nome = Object.fromEntries((pessoas ?? []).map((p) => [p.id, p.nome]));
  const tabelas = ["entidades", "caixas_faturas", "contas_bancarias", "cdg_bu", "cdg_produto", "cdg_cc", "cdg_categoria", "cdg_detalhe", "cdg_tipo", "cdg_projeto", "pessoas", "perfis", "acesso_salarial", "regras_owner", "regra_aprovadores", "documentos", "ver_como"];
  return (
    <Pagina sessao={sessao}>
      <h1>Histórico de alterações</h1>
      <p className="muted">Tudo o que muda na configuração fica aqui, com quem, quando, o valor anterior e o novo. Ninguém pode editar nem apagar este registo. Mostra as últimas 300 entradas.</p>
      <nav className="tabs">
        <Link href="/config/historico" className={!sp?.tabela ? "ativa" : ""}>Tudo</Link>
        {tabelas.map((t) => <Link key={t} href={`/config/historico?tabela=${t}`} className={sp?.tabela === t ? "ativa" : ""}>{t}</Link>)}
      </nav>
      {error && <p className="erro">{error.message}</p>}
      <div className="tbl">
        <table>
          <thead><tr><th>Quando</th><th>Quem</th><th>O quê</th><th>Onde</th><th>Detalhe</th></tr></thead>
          <tbody>
            {(linhas ?? []).map((a) => (
              <tr key={a.id}>
                <td style={{ whiteSpace: "nowrap" }}>{new Date(a.em).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}</td>
                <td>{a.pessoa_id ? nome[a.pessoa_id] ?? "?" : <span className="muted">sistema</span>}</td>
                <td>{ACOES[a.acao] ?? a.acao}</td>
                <td>{a.tabela}{a.acao === "VER_COMO" ? ` · ${nome[a.registo_id] ?? ""}` : ""}</td>
                <td style={{ fontSize: ".8rem" }}>{mudancas(a)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Pagina>
  );
}
