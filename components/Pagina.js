import Topo from "./Topo";

export default function Pagina({ sessao, children }) {
  return (
    <>
      <Topo acessos={sessao.acessos} isAdmin={sessao.isAdmin} isFinance={sessao.isFinance} />
      <main>{children}</main>
    </>
  );
}
