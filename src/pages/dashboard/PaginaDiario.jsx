import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMoeda } from "../../context/MoedaContext";
import "./diario.css";

function saudacao(nome) {
  const h = new Date().getHours();
  const cum = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${cum}${nome ? `, ${nome.split(" ")[0]}` : ""}!`;
}

function normalizarData(ts) {
  if (!ts) return new Date(0);
  if (ts?.toDate) return ts.toDate();
  return new Date(ts);
}

function mesmoDia(d, ref) {
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function labelData(d) {
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);
  if (mesmoDia(d, amanha)) return "Amanhã";
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

export default function PaginaDiario({ transacoes, aoAbrirComTipo }) {
  const { usuario } = useAuth();
  const { formatarValor: fmt } = useMoeda();

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const em7 = useMemo(() => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + 7);
    return d;
  }, [hoje]);

  const transacoesHoje = useMemo(
    () =>
      transacoes
        .filter((t) => mesmoDia(normalizarData(t.data), hoje))
        .sort((a, b) => normalizarData(b.data) - normalizarData(a.data)),
    [transacoes, hoje]
  );

  const proximasPendentes = useMemo(() => {
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    return transacoes
      .filter((t) => {
        if (t.status !== "pendente") return false;
        const d = normalizarData(t.data);
        return d >= amanha && d <= em7;
      })
      .sort((a, b) => normalizarData(a.data) - normalizarData(b.data));
  }, [transacoes, hoje, em7]);

  const atrasadas = useMemo(
    () =>
      transacoes.filter((t) => {
        if (t.status !== "pendente" || t.tipo !== "despesa") return false;
        return normalizarData(t.data) < hoje;
      }),
    [transacoes, hoje]
  );

  const entradasHoje = transacoesHoje
    .filter((t) => t.tipo === "receita" && t.status === "pago")
    .reduce((s, t) => s + t.valor, 0);
  const saidasHoje = transacoesHoje
    .filter((t) => t.tipo === "despesa" && t.status === "pago")
    .reduce((s, t) => s + t.valor, 0);
  const saldoHoje = entradasHoje - saidasHoje;

  const dataExibida = (() => {
    const s = hoje.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  return (
    <div className="pagina-diario">

      {/* ── Cabeçalho + ação rápida ── */}
      <div className="di-topo">
        <div className="di-topo-texto">
          <p className="di-saudacao">{saudacao(usuario?.displayName)}</p>
          <p className="di-data">{dataExibida}</p>
        </div>
        <div className="di-acoes-rapidas">
          <button className="di-btn-rapido di-btn-receita" onClick={() => aoAbrirComTipo("receita")}>
            <span className="di-btn-icone">↑</span>
            <span>Receita</span>
          </button>
          <button className="di-btn-rapido di-btn-despesa" onClick={() => aoAbrirComTipo("despesa")}>
            <span className="di-btn-icone">↓</span>
            <span>Despesa</span>
          </button>
        </div>
      </div>

      {/* ── Resumo do dia ── */}
      <div className="di-cards">
        <div className="di-card">
          <span className="di-card-label">Entradas</span>
          <span className="di-card-valor pos">{fmt(entradasHoje)}</span>
        </div>
        <div className="di-card">
          <span className="di-card-label">Saídas</span>
          <span className="di-card-valor neg">{fmt(saidasHoje)}</span>
        </div>
        <div className="di-card di-card-full">
          <span className="di-card-label">Saldo do dia</span>
          <span className={`di-card-valor ${saldoHoje >= 0 ? "pos" : "neg"}`}>
            {fmt(saldoHoje)}
          </span>
        </div>
      </div>

      {/* ── Atrasadas ── */}
      {atrasadas.length > 0 && (
        <div className="di-alerta">
          <span className="di-alerta-icone">⚠</span>
          <span>
            {atrasadas.length} despesa{atrasadas.length > 1 ? "s" : ""} atrasada{atrasadas.length > 1 ? "s" : ""}
            {" "}— {fmt(atrasadas.reduce((s, t) => s + t.valor, 0))} no total
          </span>
        </div>
      )}

      {/* ── Hoje ── */}
      <section className="di-secao">
        <h3 className="di-secao-titulo">Hoje</h3>
        {transacoesHoje.length === 0 ? (
          <div className="di-vazio">
            <span className="di-vazio-icone">◷</span>
            <p>Nenhuma transação hoje</p>
          </div>
        ) : (
          <div className="di-lista">
            {transacoesHoje.map((t) => {
              const isReceita = t.tipo === "receita";
              return (
                <div key={t.id} className={`di-item di-item-${t.tipo}`}>
                  <div className="di-icone">{isReceita ? "↑" : "↓"}</div>
                  <div className="di-info">
                    <span className="di-cat">{t.categoria}</span>
                    <span className="di-sub">
                      {t.status === "pago" ? "Pago" : "Pendente"}
                      {t.formaPagamento === "credito" ? " · Crédito" : t.formaPagamento === "debito" ? " · Débito" : ""}
                    </span>
                  </div>
                  <span className={`di-valor ${isReceita ? "pos" : "neg"}`}>
                    {isReceita ? "+" : "−"}{fmt(t.valor)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Próximos 7 dias ── */}
      {proximasPendentes.length > 0 && (
        <section className="di-secao">
          <h3 className="di-secao-titulo">Próximos 7 dias</h3>
          <div className="di-lista">
            {proximasPendentes.map((t) => {
              const d = normalizarData(t.data);
              return (
                <div key={t.id} className={`di-item di-item-${t.tipo}`}>
                  <div className="di-icone">{t.tipo === "receita" ? "↑" : "↓"}</div>
                  <div className="di-info">
                    <span className="di-cat">{t.categoria}</span>
                    <span className="di-sub">{labelData(d)}</span>
                  </div>
                  <span className={`di-valor ${t.tipo === "receita" ? "pos" : "neg"}`}>
                    {t.tipo === "receita" ? "+" : "−"}{fmt(t.valor)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
