import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { adicionarTransacao, removerTransacao } from "../../firebase/transacoes";
import {
  escutarRecorrentes,
  adicionarRecorrente,
  editarRecorrente,
  removerRecorrente,
} from "../../firebase/recorrentes";
import { useMoeda } from "../../context/MoedaContext";
import "./fluxo.css";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function diasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

// ── Modal de recorrente ────────────────────────────────────────────────────────

function ModalRecorrente({ uid, recorrente, aoFechar }) {
  const editando = !!recorrente;
  const [tipo, setTipo] = useState(recorrente?.tipo || "receita");
  const [nome, setNome] = useState(recorrente?.nome || "");
  const [valor, setValor] = useState(recorrente?.valor || "");
  const [dia, setDia] = useState(recorrente?.dia || 1);
  const [formaPagamento, setFormaPagamento] = useState(recorrente?.formaPagamento || "dinheiro");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSalvar() {
    if (!nome.trim()) return setErro("Informe um nome.");
    if (!valor || Number(valor) <= 0) return setErro("Informe um valor válido.");
    const diaNum = Number(dia);
    if (!diaNum || diaNum < 1 || diaNum > 31) return setErro("Dia inválido (1–31).");

    setSalvando(true);
    setErro("");
    try {
      const dados = {
        nome: nome.trim(),
        tipo,
        valor: Number(valor),
        dia: diaNum,
        formaPagamento: tipo === "despesa" ? formaPagamento : "dinheiro",
      };
      if (editando) {
        await editarRecorrente(uid, recorrente.id, dados);
      } else {
        await adicionarRecorrente(uid, dados);
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
          <h2>{editando ? "Editar pagamento fixo" : "Novo pagamento fixo"}</h2>
          <button className="botao-fechar-modal" onClick={aoFechar}>✕</button>
        </div>
        <div className="modal-corpo">

          <div className="campo-modal">
            <label>Tipo</label>
            <div className="toggle-tipo">
              <button type="button" className={`toggle-opcao ${tipo === "receita" ? "ativo" : ""}`} onClick={() => setTipo("receita")}>↑ Receita</button>
              <button type="button" className={`toggle-opcao ${tipo === "despesa" ? "ativo" : ""}`} onClick={() => { setTipo("despesa"); setFormaPagamento("dinheiro"); }}>↓ Despesa</button>
            </div>
          </div>

          <div className="campo-modal">
            <label>Nome</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Salário, Aluguel, Netflix..." />
          </div>

          <div className="campo-modal">
            <label>Valor</label>
            <div className="input-com-prefixo">
              <span>R$</span>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </div>
          </div>

          <div className="campo-modal">
            <label>Dia do mês</label>
            <input type="number" min="1" max="31" value={dia} onChange={(e) => setDia(e.target.value)} placeholder="Ex: 5" />
          </div>

          {tipo === "despesa" && (
            <div className="campo-modal">
              <label>Forma de pagamento</label>
              <div className="toggle-tipo">
                <button type="button" className={`toggle-opcao ${formaPagamento === "dinheiro" ? "ativo" : ""}`} onClick={() => setFormaPagamento("dinheiro")}>Dinheiro</button>
                <button type="button" className={`toggle-opcao ${formaPagamento === "debito" ? "ativo" : ""}`} onClick={() => setFormaPagamento("debito")}>Débito</button>
                <button type="button" className={`toggle-opcao ${formaPagamento === "credito" ? "ativo" : ""}`} onClick={() => setFormaPagamento("credito")}>Crédito</button>
              </div>
            </div>
          )}

          {erro && <p className="erro-modal">{erro}</p>}
        </div>
        <div className="modal-rodape">
          <button type="button" className="botao-cancelar" onClick={aoFechar}>Cancelar</button>
          <button type="button" className="botao-salvar" onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : editando ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function PaginaFluxo({ transacoes }) {
  const { usuario } = useAuth();
  const { formatarValor: fmtBRL } = useMoeda();
  const hoje = new Date();

  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [recorrentes, setRecorrentes] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [desfazendoId, setDesfazendoId] = useState(null);

  useEffect(() => {
    if (!usuario) return;
    return escutarRecorrentes(usuario.uid, setRecorrentes);
  }, [usuario]);

  function mesPrev() {
    if (mes === 0) { setAno((a) => a - 1); setMes(11); }
    else setMes((m) => m - 1);
  }

  function mesProx() {
    if (mes === 11) { setAno((a) => a + 1); setMes(0); }
    else setMes((m) => m + 1);
  }

  // Transações deste mês
  const transacoesMes = useMemo(() => {
    return transacoes.filter((t) => {
      const d = t.data;
      return d.getFullYear() === ano && d.getMonth() === mes;
    });
  }, [transacoes, ano, mes]);

  // Map recorrenteId → transação confirmada (para este mês)
  const confirmadosMap = useMemo(() => {
    const map = {};
    transacoesMes.forEach((t) => {
      if (t.recorrenteId) map[t.recorrenteId] = t;
    });
    return map;
  }, [transacoesMes]);

  // Transações regulares (sem vínculo com recorrente)
  const transacoesRegulares = useMemo(() => {
    return transacoesMes.filter((t) => !t.recorrenteId);
  }, [transacoesMes]);

  // Saldo acumulado antes deste mês (apenas confirmadas/pagas)
  const saldoAbertura = useMemo(() => {
    return transacoes
      .filter((t) => {
        const d = t.data;
        return d.getFullYear() < ano || (d.getFullYear() === ano && d.getMonth() < mes);
      })
      .filter((t) => t.status === "pago")
      .reduce((acc, t) => acc + (t.tipo === "receita" ? t.valor : -t.valor), 0);
  }, [transacoes, ano, mes]);

  // Resumo do mês
  const resumo = useMemo(() => {
    let recConf = 0, recPend = 0, despConf = 0, despPend = 0;

    transacoesRegulares.forEach((t) => {
      if (t.tipo === "receita") {
        if (t.status === "pago") recConf += t.valor; else recPend += t.valor;
      } else {
        if (t.status === "pago") despConf += t.valor; else despPend += t.valor;
      }
    });

    recorrentes.filter((r) => r.ativo).forEach((r) => {
      const conf = confirmadosMap[r.id];
      if (r.tipo === "receita") {
        if (conf) recConf += r.valor; else recPend += r.valor;
      } else {
        if (conf) despConf += r.valor; else despPend += r.valor;
      }
    });

    return {
      recConf,
      recPend,
      despConf,
      despPend,
      saldoConf: saldoAbertura + recConf - despConf,
      saldoProj: saldoAbertura + recConf + recPend - despConf - despPend,
    };
  }, [transacoesRegulares, recorrentes, confirmadosMap, saldoAbertura]);

  // Montar timeline dia a dia
  const timeline = useMemo(() => {
    const nDias = diasNoMes(ano, mes);
    const mapa = {};

    transacoesRegulares.forEach((t) => {
      const d = t.data.getDate();
      if (!mapa[d]) mapa[d] = { txns: [], recs: [] };
      mapa[d].txns.push(t);
    });

    recorrentes.filter((r) => r.ativo).forEach((r) => {
      const d = Math.min(r.dia, nDias);
      if (!mapa[d]) mapa[d] = { txns: [], recs: [] };
      const conf = confirmadosMap[r.id];
      mapa[d].recs.push({ ...r, confirmado: !!conf, txnConfirmada: conf || null });
    });

    let saldoAcum = saldoAbertura;
    const dias = [];

    for (let d = 1; d <= nDias; d++) {
      if (!mapa[d]) continue;
      const { txns, recs } = mapa[d];

      let delta = 0;
      txns.forEach((t) => {
        if (t.status === "pago") delta += (t.tipo === "receita" ? t.valor : -t.valor);
      });
      recs.forEach((r) => {
        if (r.confirmado) delta += (r.tipo === "receita" ? r.valor : -r.valor);
      });
      saldoAcum += delta;

      dias.push({
        dia: d,
        diaSemana: new Date(ano, mes, d).getDay(),
        txns,
        recs,
        saldo: saldoAcum,
      });
    }

    return dias;
  }, [transacoesRegulares, recorrentes, confirmadosMap, saldoAbertura, ano, mes]);

  // Confirmar recorrente (criar transação de confirmação)
  async function confirmarRecorrente(rec) {
    setConfirmandoId(rec.id);
    const nDias = diasNoMes(ano, mes);
    try {
      await adicionarTransacao(usuario.uid, rec.tipo, {
        categoria: rec.nome,
        data: new Date(ano, mes, Math.min(rec.dia, nDias)),
        valor: rec.valor,
        status: "pago",
        recorrenteId: rec.id,
        formaPagamento: rec.formaPagamento || "dinheiro",
      });
    } catch (err) {
      console.error("Erro ao confirmar:", err);
    } finally {
      setConfirmandoId(null);
    }
  }

  // Desfazer confirmação (remover transação vinculada)
  async function desfazerConfirmacao(rec) {
    if (!rec.txnConfirmada) return;
    setDesfazendoId(rec.id);
    try {
      await removerTransacao(usuario.uid, rec.txnConfirmada.id);
    } catch (err) {
      console.error("Erro ao desfazer:", err);
    } finally {
      setDesfazendoId(null);
    }
  }

  const recorrentesAtivos = recorrentes.filter((r) => r.ativo);

  return (
    <div className="pagina-fluxo">

      {/* ── Navegação de mês ── */}
      <div className="fluxo-nav-mes">
        <button className="fluxo-btn-mes" onClick={mesPrev}>‹</button>
        <h2 className="fluxo-titulo-mes">{MESES[mes]} {ano}</h2>
        <button className="fluxo-btn-mes" onClick={mesProx}>›</button>
      </div>

      {/* ── Resumo ── */}
      <div className="fluxo-resumo">
        <div className="fluxo-resumo-item verde">
          <span className="fluxo-resumo-label">Entradas confirmadas</span>
          <span className="fluxo-resumo-valor">{fmtBRL(resumo.recConf)}</span>
        </div>
        <div className="fluxo-resumo-item verde-suave">
          <span className="fluxo-resumo-label">A receber</span>
          <span className="fluxo-resumo-valor">{fmtBRL(resumo.recPend)}</span>
        </div>
        <div className="fluxo-resumo-item vermelho">
          <span className="fluxo-resumo-label">Saídas confirmadas</span>
          <span className="fluxo-resumo-valor">{fmtBRL(resumo.despConf)}</span>
        </div>
        <div className="fluxo-resumo-item vermelho-suave">
          <span className="fluxo-resumo-label">A pagar</span>
          <span className="fluxo-resumo-valor">{fmtBRL(resumo.despPend)}</span>
        </div>
        <div className={`fluxo-resumo-item saldo ${resumo.saldoProj >= 0 ? "positivo" : "negativo"}`}>
          <span className="fluxo-resumo-label">Saldo projetado</span>
          <span className="fluxo-resumo-valor">{fmtBRL(resumo.saldoProj)}</span>
        </div>
      </div>

      <div className="fluxo-grade">

        {/* ── Pagamentos fixos ── */}
        <div className="fluxo-secao">
          <div className="fluxo-secao-cab">
            <h3 className="fluxo-secao-titulo">Pagamentos fixos</h3>
            <button
              className="fluxo-btn-adicionar"
              onClick={() => { setEditando(null); setModalAberto(true); }}
            >
              + Adicionar
            </button>
          </div>

          {recorrentesAtivos.length === 0 ? (
            <p className="fluxo-vazio">
              Nenhum pagamento fixo. Adicione lançamentos que se repetem todo mês (salário, aluguel, assinaturas…).
            </p>
          ) : (
            <div className="fluxo-rec-lista">
              {recorrentesAtivos.map((r) => (
                <div key={r.id} className={`fluxo-rec-item ${r.tipo}`}>
                  <span className={`fluxo-rec-seta ${r.tipo}`}>{r.tipo === "receita" ? "↑" : "↓"}</span>
                  <div className="fluxo-rec-info">
                    <p className="fluxo-rec-nome">{r.nome}</p>
                    <p className="fluxo-rec-det">dia {r.dia} · {fmtBRL(r.valor)}{r.formaPagamento && r.formaPagamento !== "dinheiro" ? ` · ${r.formaPagamento}` : ""}</p>
                  </div>
                  <div className="fluxo-rec-acoes">
                    <button className="fluxo-rec-btn editar" onClick={() => { setEditando(r); setModalAberto(true); }} title="Editar">✎</button>
                    <button className="fluxo-rec-btn excluir" onClick={() => removerRecorrente(usuario.uid, r.id)} title="Excluir">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Timeline ── */}
        <div className="fluxo-secao fluxo-timeline-col">
          <div className="fluxo-secao-cab">
            <h3 className="fluxo-secao-titulo">Lançamentos do mês</h3>
            <span className="fluxo-abertura">Abertura: <strong>{fmtBRL(saldoAbertura)}</strong></span>
          </div>

          {timeline.length === 0 ? (
            <p className="fluxo-vazio">
              Sem lançamentos em {MESES[mes]}. Adicione transações ou configure pagamentos fixos.
            </p>
          ) : (
            <div className="fluxo-timeline">
              {timeline.map(({ dia, diaSemana, txns, recs, saldo }) => (
                <div key={dia} className="fluxo-dia">
                  <div className="fluxo-dia-header">
                    <div className="fluxo-dia-id">
                      <span className="fluxo-dia-num">{dia}</span>
                      <span className="fluxo-dia-sem">{DIAS_SEMANA[diaSemana]}</span>
                    </div>
                    <span className={`fluxo-dia-saldo ${saldo >= 0 ? "positivo" : "negativo"}`}>
                      {fmtBRL(saldo)}
                    </span>
                  </div>

                  <div className="fluxo-dia-itens">
                    {/* Transações regulares */}
                    {txns.map((t) => (
                      <div key={t.id} className={`fluxo-item ${t.tipo} ${t.status}`}>
                        <span className={`fluxo-item-seta ${t.tipo}`}>{t.tipo === "receita" ? "↑" : "↓"}</span>
                        <span className="fluxo-item-cat">{t.categoria}</span>
                        {(t.parcelasTotal || 1) > 1 && (
                          <span className="fluxo-badge parcela">{t.parcelaAtual}/{t.parcelasTotal}</span>
                        )}
                        {t.formaPagamento && t.formaPagamento !== "dinheiro" && (
                          <span className="fluxo-badge">{t.formaPagamento}</span>
                        )}
                        <span className={`fluxo-item-valor ${t.tipo}`}>{fmtBRL(t.valor)}</span>
                        <span className={`fluxo-item-dot ${t.status}`} title={t.status === "pago" ? "Confirmado" : "Pendente"}>
                          {t.status === "pago" ? "●" : "○"}
                        </span>
                      </div>
                    ))}

                    {/* Itens recorrentes */}
                    {recs.map((r) => (
                      <div key={r.id} className={`fluxo-item ${r.tipo} ${r.confirmado ? "pago" : "pendente"}`}>
                        <span className={`fluxo-item-seta ${r.tipo}`}>{r.tipo === "receita" ? "↑" : "↓"}</span>
                        <span className="fluxo-item-cat">{r.nome}</span>
                        <span className="fluxo-badge fixo">fixo</span>
                        {r.formaPagamento && r.formaPagamento !== "dinheiro" && (
                          <span className="fluxo-badge">{r.formaPagamento}</span>
                        )}
                        <span className={`fluxo-item-valor ${r.tipo}`}>{fmtBRL(r.valor)}</span>
                        {r.confirmado ? (
                          <button
                            className="fluxo-btn-desfazer"
                            onClick={() => desfazerConfirmacao(r)}
                            disabled={desfazendoId === r.id}
                            title="Desfazer confirmação"
                          >
                            {desfazendoId === r.id ? "…" : "✓"}
                          </button>
                        ) : (
                          <button
                            className="fluxo-btn-confirmar"
                            onClick={() => confirmarRecorrente(r)}
                            disabled={confirmandoId === r.id}
                            title={r.tipo === "receita" ? "Confirmar recebimento" : "Confirmar pagamento"}
                          >
                            {confirmandoId === r.id ? "…" : r.tipo === "receita" ? "Receber" : "Pagar"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <ModalRecorrente
          uid={usuario.uid}
          recorrente={editando}
          aoFechar={() => { setModalAberto(false); setEditando(null); }}
        />
      )}
    </div>
  );
}
