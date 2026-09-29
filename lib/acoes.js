import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Termina uma ação de formulário: volta à página com uma mensagem de sucesso ou de erro.
export function voltar(caminho, error, sucesso = "Gravado.") {
  revalidatePath(caminho);
  const [base, query = ""] = caminho.split("?");
  const sp = new URLSearchParams(query);
  if (error) sp.set("erro", traduzirErro(error));
  else sp.set("ok", sucesso);
  redirect(`${base}?${sp.toString()}`);
}

function traduzirErro(error) {
  const m = error?.message ?? String(error);
  if (/duplicate key|unique/i.test(m)) return "Já existe um registo com esses dados.";
  if (/row-level security|permission denied/i.test(m)) return "Não tens permissão para esta alteração.";
  if (/foreign key/i.test(m)) return "Há registos que dependem deste; desative-o em vez de o apagar.";
  return m;
}

export const txt = (fd, k) => {
  const v = fd.get(k);
  return v == null || String(v).trim() === "" ? null : String(v).trim();
};

export const hoje = () => new Date().toISOString().slice(0, 10);
export const ontem = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);
