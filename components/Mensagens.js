export default function Mensagens({ sp }) {
  return (
    <>
      {sp?.ok && <p className="ok">{sp.ok}</p>}
      {sp?.erro && <p className="erro">{sp.erro}</p>}
    </>
  );
}
