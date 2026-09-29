import Pagina from "@/components/Pagina";
import TabelaDocumentos from "@/components/TabelaDocumentos";
import { exigirSessao } from "@/lib/sessao";

export const metadata = { title: "Documentos · Finance Brain" };

export default async function Documentos() {
  const sessao = await exigirSessao();
  const { supabase } = sessao;
  const [{ data: entidades }, { data: documentos, error }] = await Promise.all([
    supabase.from("entidades").select("id,codigo"),
    supabase.from("documentos").select("*").order("data_documento", { ascending: false }),
  ]);
  return (
    <Pagina sessao={sessao}>
      <h1>Documentos</h1>
      <p className="muted">Faturas e notas de crédito que o teu perfil permite ver. Nesta fase são documentos fictícios, para testar os acessos.</p>
      {error && <p className="erro">Erro a ler documentos: {error.message}</p>}
      <TabelaDocumentos documentos={documentos} entidades={entidades} />
    </Pagina>
  );
}
