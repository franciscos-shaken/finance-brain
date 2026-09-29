import Link from "next/link";

const AMBIENTE = process.env.VERCEL_ENV ?? "local";

export default function Topo({ acessos, isAdmin, isFinance }) {
  return (
    <header className="topo">
      <Link href="/" className="marca">Finance Brain</Link>
      <nav>
        <Link href="/">Início</Link>
        <Link href="/documentos">Documentos</Link>
        {isFinance && <Link href="/config/cdg">Listas do CdG</Link>}
        {isAdmin && <Link href="/config/owners">Owners</Link>}
        {isAdmin && <Link href="/config/pessoas">Pessoas e perfis</Link>}
        {isAdmin && <Link href="/config/entidades">Entidades</Link>}
        {isAdmin && <Link href="/config/ver-como">Ver como</Link>}
        {isAdmin && <Link href="/config/historico">Histórico</Link>}
      </nav>
      <div className="quem">
        {AMBIENTE !== "production" && <span className="env">{AMBIENTE === "preview" ? "Testes" : AMBIENTE}</span>}
        <span>{acessos?.pessoa?.nome}</span>
        <a href="/auth/sair">Sair</a>
      </div>
    </header>
  );
}
