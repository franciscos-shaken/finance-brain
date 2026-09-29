const NOMES = { administrador: "Administrador", finance: "Finance", leitura: "Leitura", colaborador: "Colaborador" };

// Mostra perfis, CC que aprova e acesso salarial de uma pessoa (usado no Início e em "Ver como").
export default function Resumo({ acessos }) {
  const perfis = acessos?.perfis ?? [];
  const aprova = acessos?.aprova ?? [];
  return (
    <div className="cards">
      <div className="card">
        <span className="muted">Perfis</span>
        <div className="chips" style={{ marginTop: 6 }}>
          {perfis.length === 0 && <span className="chip warn">Nenhum</span>}
          {perfis.map((p, i) => (
            <span key={i} className="chip">{NOMES[p.perfil] ?? p.perfil}{p.entidade ? ` · ${p.entidade}` : " · todas as entidades"}</span>
          ))}
        </div>
      </div>
      <div className="card">
        <span className="muted">Aprova</span>
        <div className="chips" style={{ marginTop: 6 }}>
          {aprova.length === 0 && <span className="chip">Nenhum CC</span>}
          {aprova.map((a, i) => (
            <span key={i} className="chip">{a.familia} × {a.cc}{a.papel === "substituto" ? " (substituto)" : ""}</span>
          ))}
        </div>
      </div>
      <div className="card">
        <span className="muted">Dados salariais</span>
        <b style={{ fontSize: "1rem", marginTop: 6 }}>{acessos?.acesso_salarial ? "Tem acesso" : "Sem acesso"}</b>
      </div>
    </div>
  );
}
