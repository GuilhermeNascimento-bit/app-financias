import { removerTransacao } from "../../firebase/transacoes";
import { useMoeda } from "../../context/MoedaContext";

function formatarData(data) {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function badgeStatus(t) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (t.status === "pago") return { texto: "Pago", classe: "badge-pago" };

  const dataT = new Date(t.data);
  dataT.setHours(0, 0, 0, 0);

  if (dataT < hoje) return { texto: "Atrasado", classe: "badge-atrasado" };
  return { texto: "Pendente", classe: "badge-pendente" };
}

export default function ListaTransacoes({ transacoes, uid, aoEditar, resumido, modoLembrete }) {
  const { formatarValor } = useMoeda();

  async function handleRemover(id) {
    if (!window.confirm("Remover esta transação?")) return;
    try {
      await removerTransacao(uid, id);
    } catch {
      alert("Não foi possível remover. Tente novamente.");
    }
  }

  if (transacoes.length === 0) {
    return (
      <div className="estado-vazio">
        <p>
          {modoLembrete
            ? "Nenhuma pendência encontrada."
            : "Nenhuma transação registrada ainda."}
        </p>
      </div>
    );
  }

  return (
    <div className="lista-transacoes">
      {transacoes.map((t) => {
        const badge = badgeStatus(t);
        return (
          <div key={t.id} className="item-transacao">
            <div className={`icone-transacao ${t.tipo === "receita" ? "icone-receita" : "icone-despesa"}`}>
              {t.tipo === "receita" ? "↑" : "↓"}
            </div>

            <div className="info-transacao">
              <p className="nome-transacao">{t.categoria}</p>
              <p className="data-transacao">{formatarData(t.data)}</p>
            </div>

            <span className={`badge-status ${badge.classe}`}>{badge.texto}</span>

            <p className={`valor-transacao ${t.tipo === "receita" ? "valor-positivo" : "valor-negativo"}`}>
              {t.tipo === "receita" ? "+" : "-"}{formatarValor(t.valor)}
            </p>

            {!resumido && (
              <div className="acoes-transacao">
                <button className="botao-acao" onClick={() => aoEditar(t)} title="Editar">✎</button>
                <button className="botao-acao botao-remover" onClick={() => handleRemover(t.id)} title="Remover">✕</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
