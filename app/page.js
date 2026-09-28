// Variáveis de sistema que o Vercel define automaticamente em cada deploy.
// Localmente não existem, por isso mostramos um valor por omissão.
const ambiente = process.env.VERCEL_ENV ?? "local";
const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "—";
const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "—";

export default function Home() {
  return (
    <main>
      <h1>Olá, mundo 👋</h1>
      <p>Finance Brain está vivo.</p>
      <ul>
        <li>
          <strong>Ambiente:</strong> {ambiente}
        </li>
        <li>
          <strong>Branch:</strong> {branch}
        </li>
        <li>
          <strong>Commit:</strong> <code>{commit}</code>
        </li>
      </ul>
    </main>
  );
}
