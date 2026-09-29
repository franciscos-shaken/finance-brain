import FormLogin from "./FormLogin";

const MENSAGENS = {
  "sem-acesso": "Esta conta não tem acesso ao Finance Brain. Se devia ter, fala com a equipa de Finance.",
  "link-invalido": "O link de entrada já não é válido. Pede um novo.",
  reentrar: "Por segurança, volta a entrar para mexer na configuração.",
};

export const metadata = { title: "Entrar · Finance Brain" };

export default async function Login({ searchParams }) {
  const sp = await searchParams;
  const aviso = MENSAGENS[sp?.erro] ?? MENSAGENS[sp?.motivo];
  return (
    <main className="login">
      <div className="login-caixa">
        <h1>Finance Brain</h1>
        <p className="muted">Grupo Shaken · Finance</p>
        {aviso && <p className="aviso">{aviso}</p>}
        <FormLogin />
      </div>
    </main>
  );
}
