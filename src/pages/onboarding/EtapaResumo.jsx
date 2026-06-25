// EtapaResumo.jsx
// Mostra um resumo de tudo que foi informado, com totais e uma
// prévia visual simples (barra de proporção receita x despesa),
// antes de confirmar e salvar no Firestore.

import { useMoeda } from "../../context/MoedaContext";

export default function EtapaResumo({ dados, salvando, erro, aoConfirmar, aoVoltar }) {
  const { formatarValor } = useMoeda();
  const totalRenda = somar(dados.renda);
  const totalFixas = somar(dados.despesasFixas);
  const totalVariaveis = somar(dados.despesasVariaveis);
  const totalDespesas = totalFixas + totalVariaveis;
  const saldo = totalRenda - totalDespesas;

  const percentualDespesa = totalRenda > 0
    ? Math.min(100, Math.round((totalDespesas / totalRenda) * 100))
    : 0;

  return (
    <div className="etapa">
      <h2>Confira seu resumo</h2>
      <p className="texto-etapa">
        Veja se está tudo certo antes de criarmos seu painel.
      </p>

      <div className="resumo-cards">
        <div className="resumo-card">
          <span className="resumo-label">Renda</span>
          <span className="resumo-valor resumo-positivo">{formatarValor(totalRenda)}</span>
        </div>
        <div className="resumo-card">
          <span className="resumo-label">Despesas</span>
          <span className="resumo-valor resumo-negativo">{formatarValor(totalDespesas)}</span>
        </div>
        <div className="resumo-card">
          <span className="resumo-label">Saldo previsto</span>
          <span className={`resumo-valor ${saldo >= 0 ? "resumo-positivo" : "resumo-negativo"}`}>
            {formatarValor(saldo)}
          </span>
        </div>
      </div>

      <div className="barra-proporcao">
        <div className="barra-proporcao-preenchida" style={{ width: `${percentualDespesa}%` }} />
      </div>
      <p className="texto-etapa texto-secundario">
        Suas despesas representam {percentualDespesa}% da sua renda mensal.
      </p>

      {dados.renda.length === 0 && dados.despesasFixas.length === 0 && dados.despesasVariaveis.length === 0 && (
        <p className="texto-etapa texto-secundario">
          Você não informou nenhum valor — sem problema, pode adicionar tudo depois direto no painel.
        </p>
      )}

      {erro && <p className="mensagem-erro">{erro}</p>}

      <div className="botoes-navegacao">
        <button type="button" className="botao-secundario" onClick={aoVoltar} disabled={salvando}>
          Voltar
        </button>
        <button type="button" className="botao-primario" onClick={aoConfirmar} disabled={salvando}>
          {salvando ? "Salvando..." : "Confirmar e ver meu painel"}
        </button>
      </div>
    </div>
  );
}

function somar(itens) {
  return itens.reduce((total, item) => total + Number(item.valor || 0), 0);
}

