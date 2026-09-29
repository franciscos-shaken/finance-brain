import Pagina from "@/components/Pagina";
import Resumo from "@/components/Resumo";
import TabelaDocumentos from "@/components/TabelaDocumentos";
import { exigirConfig } from "@/lib/sessao";

export const metadata = { title: "Ver como · Finance Brain" };

export default async function VerComo({ searchParams }) {
  const sessao = await exigirConfig();
  const sp = await searchParams;
  const { supabase } = sessao;
  const [{ data: pessoas }, { data: entidades }] = await Promise.all([
    supabase.from("pessoas").select("id,nome,ativa").order("nome"),
    supabase.from("entidades").select("id,codigo"),
  ]);
  let resultado = null, erro = null;
  if (sp?.p) {
    const { data, error } = await supabase.rpc("fb_ver_como", { p_alvo: sp.p });
    resultado = data; erro = error;
  }
  return (
    <Pagina sessao={sessao}>
      <h1>Ver como</h1>
      <p className="muted">Mostra a app como outra pessoa a vê, só para leitura. Cada consulta fica no histórico.</p>
      <form className="linha" action="/config/ver-como">
        <label>Pessoa<select name="p" defaultValue={sp?.p ?? ""} required>
          <option value="" disabled>Escolher…</option>
          {(pessoas ?? []).map((p) => <option key={p.id} value={p.id}>{p.nome}{p.ativa ? "" : " (inativa)"}</option>)}
        </select></label>
        <button className="btn btn-primario">Ver</button>
      </form>
      {erro && <p className="erro">{erro.message}</p>}
      {resultado && (
        <>
          <h2>{resultado.pessoa?.nome} · {resultado.pessoa?.email}</h2>
          <Resumo acessos={resultado} />
          <h2>Documentos que vê ({resultado.documentos?.length ?? 0})</h2>
          <TabelaDocumentos documentos={resultado.documentos} entidades={entidades} />
        </>
      )}
    </Pagina>
  );
}
