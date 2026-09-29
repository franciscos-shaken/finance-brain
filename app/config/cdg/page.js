import Link from "next/link";
import Pagina from "@/components/Pagina";
import Mensagens from "@/components/Mensagens";
import { exigirConfig } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { voltar, txt } from "@/lib/acoes";

export const metadata = { title: "Listas do CdG · Finance Brain" };

// Cada separador corresponde a uma folha da BD_Dropdowns_MasterFile.
const LISTAS = {
  bu:        { nome: "Business Units", tabela: "cdg_bu", chave: "codigo", colunas: [["codigo", "BU (código Primavera)"], ["familia", "Família"], ["epoca", "Época"], ["notas", "Notas"]], ordem: "codigo" },
  produto:   { nome: "Produtos", tabela: "cdg_produto", colunas: [["bu", "BU"], ["produto", "Produto"]], ordem: "bu" },
  cc:        { nome: "Centros de custo", tabela: "cdg_cc", colunas: [["bu", "BU"], ["produto", "Produto"], ["cc", "Centro de custo"]], ordem: "bu" },
  categoria: { nome: "Categorias", tabela: "cdg_categoria", colunas: [["cc", "Centro de custo"], ["categoria", "Categoria"]], ordem: "cc" },
  detalhe:   { nome: "Detalhes", tabela: "cdg_detalhe", colunas: [["categoria", "Categoria"], ["detalhe", "Detalhe"]], ordem: "categoria" },
  tipo:      { nome: "Tipos", tabela: "cdg_tipo", colunas: [["detalhe", "Detalhe"], ["tipo", "Tipo"]], ordem: "detalhe" },
  projeto:   { nome: "Projetos", tabela: "cdg_projeto", colunas: [["nome", "Projeto"]], ordem: "nome" },
};

function caminho(lista, q) {
  const sp = new URLSearchParams({ lista });
  if (q) sp.set("q", q);
  return `/config/cdg?${sp}`;
}

async function acrescentar(fd) {
  "use server";
  await exigirConfig({ soAdmin: false });
  const lista = LISTAS[fd.get("lista")];
  const linha = {};
  lista.colunas.forEach(([c]) => { linha[c] = txt(fd, c); });
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from(lista.tabela).insert(linha);
  voltar(caminho(fd.get("lista"), fd.get("q")), error, "Valor acrescentado.");
}

async function alternar(fd) {
  "use server";
  await exigirConfig({ soAdmin: false });
  const lista = LISTAS[fd.get("lista")];
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from(lista.tabela).update({ ativo: fd.get("ativo") !== "true" }).eq(lista.chave ?? "id", fd.get("chave"));
  voltar(caminho(fd.get("lista"), fd.get("q")), error, fd.get("ativo") === "true" ? "Valor desativado." : "Valor reativado.");
}

async function gravarBU(fd) {
  "use server";
  await exigirConfig({ soAdmin: false });
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("cdg_bu").update({ familia: txt(fd, "familia"), epoca: txt(fd, "epoca"), notas: txt(fd, "notas") }).eq("codigo", fd.get("chave"));
  voltar(caminho("bu", fd.get("q")), error, "BU gravada.");
}

export default async function ListasCdG({ searchParams }) {
  const sessao = await exigirConfig({ soAdmin: false });
  const sp = await searchParams;
  const id = LISTAS[sp?.lista] ? sp.lista : "bu";
  const lista = LISTAS[id];
  const q = (sp?.q ?? "").trim();
  const { supabase } = sessao;

  let consulta = supabase.from(lista.tabela).select("*", { count: "exact" }).order(lista.ordem).limit(500);
  if (q) consulta = consulta.or(lista.colunas.map(([c]) => `${c}.ilike.%${q.replace(/[,()%]/g, " ")}%`).join(","));
  const { data: linhas, count, error } = await consulta;

  return (
    <Pagina sessao={sessao}>
      <h1>Listas do CdG</h1>
      <p className="muted">Valores válidos para classificar documentos. Estão importados da BD_Dropdowns_MasterFile, que continua a ser a lista-mestre até ao go-live. Desativar um valor tira-o das escolhas sem apagar o histórico.</p>
      <Mensagens sp={sp} />
      <nav className="tabs">
        {Object.entries(LISTAS).map(([k, l]) => (
          <Link key={k} href={caminho(k)} className={k === id ? "ativa" : ""}>{l.nome}</Link>
        ))}
      </nav>
      <form className="linha" action="/config/cdg">
        <input type="hidden" name="lista" value={id} />
        <label>Procurar<input name="q" defaultValue={q} placeholder="texto" /></label>
        <button className="btn">Filtrar</button>
        <span className="muted">{count ?? 0} registos{count > 500 ? " (a mostrar 500)" : ""}</span>
      </form>
      {error && <p className="erro">{error.message}</p>}
      <div className="tbl">
        <table>
          <thead><tr>{lista.colunas.map(([c, n]) => <th key={c}>{n}</th>)}<th>Estado</th><th></th></tr></thead>
          <tbody>
            {(linhas ?? []).map((l) => {
              const chave = l[lista.chave ?? "id"];
              return (
                <tr key={chave} className={l.ativo ? "" : "inativo"}>
                  {id === "bu" ? (
                    <td colSpan={4}>
                      <form action={gravarBU} className="linha" style={{ margin: 0, border: 0, padding: 0 }}>
                        <input type="hidden" name="chave" value={chave} /><input type="hidden" name="q" value={q} />
                        <code>{l.codigo}</code>
                        <input name="familia" defaultValue={l.familia} aria-label="Família" size={18} />
                        <input name="epoca" defaultValue={l.epoca ?? ""} aria-label="Época" size={8} />
                        <input name="notas" defaultValue={l.notas ?? ""} aria-label="Notas" size={28} />
                        <button className="btn btn-pequeno">Gravar</button>
                      </form>
                    </td>
                  ) : (
                    lista.colunas.map(([c]) => <td key={c}>{l[c]}</td>)
                  )}
                  <td>{l.ativo ? "Ativo" : "Inativo"}</td>
                  <td>
                    <form action={alternar} className="inline">
                      <input type="hidden" name="lista" value={id} /><input type="hidden" name="q" value={q} />
                      <input type="hidden" name="chave" value={chave} /><input type="hidden" name="ativo" value={String(l.ativo)} />
                      <button className="btn btn-pequeno">{l.ativo ? "Desativar" : "Reativar"}</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2>Acrescentar a {lista.nome.toLowerCase()}</h2>
      <form action={acrescentar} className="linha">
        <input type="hidden" name="lista" value={id} /><input type="hidden" name="q" value={q} />
        {lista.colunas.map(([c, n]) => (
          <label key={c}>{n}<input name={c} required={c !== "notas" && c !== "epoca"} /></label>
        ))}
        <button className="btn btn-primario">Acrescentar</button>
      </form>
      <p className="muted">Os códigos têm de ser exatamente iguais aos do Primavera (maiúsculas, espaços e underscores).</p>
    </Pagina>
  );
}
