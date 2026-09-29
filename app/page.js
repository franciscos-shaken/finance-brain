import Pagina from "@/components/Pagina";
import Resumo from "@/components/Resumo";
import { exigirSessao } from "@/lib/sessao";

export default async function Inicio({ searchParams }) {
  const sessao = await exigirSessao();
  const sp = await searchParams;
  const { supabase, acessos } = sessao;
  const [{ data: entidades }, { data: docs }] = await Promise.all([
    supabase.from("entidades").select("id,codigo,nome_legal").order("codigo"),
    supabase.from("documentos").select("id,entidade_id,estado"),
  ]);
  const porEntidade = Object.fromEntries((entidades ?? []).map((e) => [e.id, 0]));
  (docs ?? []).forEach((d) => { porEntidade[d.entidade_id] = (porEntidade[d.entidade_id] ?? 0) + 1; });
  const porAprovar = (docs ?? []).filter((d) => d.estado === "por_aprovar").length;

  return (
    <Pagina sessao={sessao}>
      {sp?.erro === "sem-permissao" && <p className="aviso">Não tens permissão para abrir essa página.</p>}
      <h1>Olá, {acessos.pessoa.nome.split(" ")[0]}</h1>
      <p className="muted">O que vês aqui depende dos teus perfis e dos centros de custo que aprovas.</p>
      <Resumo acessos={acessos} />
      <h2>Documentos que podes ver</h2>
      <div className="cards">
        <div className="card"><span className="muted">Total</span><b>{docs?.length ?? 0}</b></div>
        <div className="card"><span className="muted">Por aprovar</span><b>{porAprovar}</b></div>
        {(entidades ?? []).map((e) => (
          <div className="card" key={e.id}><span className="muted">{e.codigo}</span><b>{porEntidade[e.id]}</b></div>
        ))}
      </div>
    </Pagina>
  );
}
