const ESTADOS = { por_classificar: "Por classificar", por_aprovar: "Por aprovar", aprovado: "Aprovado", devolvido: "Devolvido", rejeitado: "Rejeitado" };
const eur = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

export default function TabelaDocumentos({ documentos, entidades }) {
  const codigo = Object.fromEntries((entidades ?? []).map((e) => [e.id, e.codigo]));
  if (!documentos?.length) return <p className="muted">Nenhum documento visível.</p>;
  return (
    <div className="tbl">
      <table>
        <thead>
          <tr><th>Data</th><th>Entidade</th><th>Número</th><th>Fornecedor</th><th>BU</th><th>Produto</th><th>CC</th><th>Categoria</th><th>Detalhe</th><th className="n">Valor</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {documentos.map((d) => (
            <tr key={d.id}>
              <td>{d.data_documento}</td>
              <td>{codigo[d.entidade_id] ?? "—"}</td>
              <td>{d.numero}</td>
              <td>{d.fornecedor_nome}</td>
              <td>{d.bu}</td>
              <td>{d.produto}</td>
              <td>{d.cc}</td>
              <td>{d.categoria}</td>
              <td>{d.detalhe}</td>
              <td className="n">{d.valor_total != null ? eur.format(d.valor_total) : "—"}</td>
              <td>{ESTADOS[d.estado] ?? d.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
