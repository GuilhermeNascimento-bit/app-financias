import { useState } from "react";
import { adicionarTransacao, editarTransacao } from "../../firebase/transacoes";
import { useMoeda } from "../../context/MoedaContext";

const OPCOES_PARCELAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function ModalTransacao({ uid, transacao, aoFechar, tipoInicial = "despesa" }) {
  const editando = !!transacao;

  const [tipo, setTipo] = useState(transacao?.tipo || tipoInicial);
  const [categoria, setCategoria] = useState(transacao?.categoria || "");
  const [valor, setValor] = useState(transacao?.valor || "");
  const [data, setData] = useState(
    transacao?.data
      ? new Date(transacao.data).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState(transacao?.status || "pendente");
  const [formaPagamento, setFormaPagamento] = useState(transacao?.formaPagamento || "dinheiro");
  const [parcelas, setParcelas] = useState(transacao?.parcelasTotal || 1);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const { formatarValor } = useMoeda();
  const mostrarPagamento = tipo === "despesa";
  const mostrarParcelas = mostrarPagamento && formaPagamento === "credito" && !editando;
  const isParcelado = editando && (transacao?.parcelasTotal || 1) > 1;

  async function handleSalvar() {
    if (!categoria.trim()) return setErro("Informe a categoria.");
    if (!valor || Number(valor) <= 0) return setErro("Informe um valor válido.");
    if (!data) return setErro("Informe a data.");

    setSalvando(true);
    setErro("");

    try {
      if (editando) {
        await editarTransacao(uid, transacao.id, {
          tipo,
          categoria: categoria.trim(),
          data,
          valor: Number(valor),
          status,
          ...(tipo === "despesa" ? { formaPagamento } : {}),
        });
      } else if (tipo === "despesa" && formaPagamento === "credito" && parcelas > 1) {
        const grupoId = crypto.randomUUID();
        const baseDate = new Date(data);
        const total = Number(valor);
        const valorParcela = Math.round((total / parcelas) * 100) / 100;
        const promises = [];

        for (let i = 0; i < parcelas; i++) {
          const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, baseDate.getDate());
          const v = i === parcelas - 1
            ? Math.round((total - valorParcela * (parcelas - 1)) * 100) / 100
            : valorParcela;
          promises.push(
            adicionarTransacao(uid, "despesa", {
              categoria: `${categoria.trim()} (${i + 1}/${parcelas})`,
              data: d,
              valor: v,
              status: i === 0 ? status : "pendente",
              formaPagamento: "credito",
              parcelaAtual: i + 1,
              parcelasTotal: parcelas,
              grupoParcelasId: grupoId,
            })
          );
        }
        await Promise.all(promises);
      } else {
        await adicionarTransacao(uid, tipo, {
          categoria: categoria.trim(),
          data,
          valor: Number(valor),
          status,
          ...(tipo === "despesa" ? { formaPagamento } : {}),
        });
      }

      aoFechar();
    } catch {
      setErro("Não foi possível salvar. Tente novamente.");
      setSalvando(false);
    }
  }

  return (
    <div className="overlay-modal" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal">
        <div className="modal-cabecalho">
          <h2>{editando ? "Editar transação" : "Nova transação"}</h2>
          <button className="botao-fechar-modal" onClick={aoFechar}>✕</button>
        </div>

        <div className="modal-corpo">
          {/* Tipo */}
          <div className="campo-modal">
            <label>Tipo</label>
            <div className="toggle-tipo">
              <button
                type="button"
                className={`toggle-opcao ${tipo === "despesa" ? "ativo" : ""}`}
                onClick={() => { setTipo("despesa"); setFormaPagamento("dinheiro"); setParcelas(1); }}
              >
                ↓ Despesa
              </button>
              <button
                type="button"
                className={`toggle-opcao ${tipo === "receita" ? "ativo" : ""}`}
                onClick={() => setTipo("receita")}
              >
                ↑ Receita
              </button>
            </div>
          </div>

          {/* Categoria */}
          <div className="campo-modal">
            <label htmlFor="categoria">Categoria</label>
            <input
              id="categoria"
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: Aluguel, Salário..."
            />
          </div>

          {/* Valor */}
          <div className="campo-modal">
            <label htmlFor="valor">Valor</label>
            <div className="input-com-prefixo">
              <span>R$</span>
              <input
                id="valor"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Data */}
          <div className="campo-modal">
            <label htmlFor="data">Data</label>
            <input
              id="data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="campo-modal">
            <label>Status</label>
            <div className="toggle-tipo">
              <button
                type="button"
                className={`toggle-opcao ${status === "pendente" ? "ativo" : ""}`}
                onClick={() => setStatus("pendente")}
              >
                Pendente
              </button>
              <button
                type="button"
                className={`toggle-opcao ${status === "pago" ? "ativo" : ""}`}
                onClick={() => setStatus("pago")}
              >
                {tipo === "receita" ? "Recebido" : "Pago"}
              </button>
            </div>
          </div>

          {/* Forma de pagamento — só para despesas */}
          {mostrarPagamento && (
            <div className="campo-modal">
              <label>Forma de pagamento</label>
              <div className="toggle-tipo">
                <button
                  type="button"
                  className={`toggle-opcao ${formaPagamento === "dinheiro" ? "ativo" : ""}`}
                  onClick={() => { setFormaPagamento("dinheiro"); setParcelas(1); }}
                >
                  Dinheiro
                </button>
                <button
                  type="button"
                  className={`toggle-opcao ${formaPagamento === "debito" ? "ativo" : ""}`}
                  onClick={() => { setFormaPagamento("debito"); setParcelas(1); }}
                >
                  Débito
                </button>
                <button
                  type="button"
                  className={`toggle-opcao ${formaPagamento === "credito" ? "ativo" : ""}`}
                  onClick={() => setFormaPagamento("credito")}
                >
                  Crédito
                </button>
              </div>
            </div>
          )}

          {/* Parcelas — crédito, apenas criação */}
          {mostrarParcelas && (
            <div className="campo-modal">
              <label>Parcelas</label>
              <div className="grade-parcelas">
                {OPCOES_PARCELAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`parcela-opcao ${parcelas === n ? "ativo" : ""}`}
                    onClick={() => setParcelas(n)}
                  >
                    {n}×
                  </button>
                ))}
              </div>
              {parcelas > 1 && (
                <p className="parcelas-info">
                  {parcelas}× de{" "}
                  <strong>
                    {formatarValor(Number(valor) / parcelas || 0)}
                  </strong>{" "}
                  — lançamentos criados para os próximos meses
                </p>
              )}
            </div>
          )}

          {/* Aviso ao editar parcela */}
          {isParcelado && (
            <p className="parcelas-info aviso">
              Parcela {transacao.parcelaAtual}/{transacao.parcelasTotal} — edite cada parcela individualmente.
            </p>
          )}

          {erro && <p className="erro-modal">{erro}</p>}
        </div>

        <div className="modal-rodape">
          <button type="button" className="botao-cancelar" onClick={aoFechar}>
            Cancelar
          </button>
          <button
            type="button"
            className="botao-salvar"
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : editando
              ? "Salvar alterações"
              : parcelas > 1
              ? `Criar ${parcelas} parcelas`
              : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
