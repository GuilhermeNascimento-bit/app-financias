import { useState } from "react";
import { calcularRelatorio } from "../../firebase/transacoes";
import { useMoeda } from "../../context/MoedaContext";
import "./recomendacoes.css";

function gerarDicas(relatorio, transacoes, fmt) {
  const { totalReceitas, totalDespesasPagas, saldoReal, despesas } = relatorio;
  const dicas = [];

  const porCategoria = {};
  despesas.forEach((d) => {
    porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + d.valor;
  });

  const percentualGasto = totalReceitas > 0
    ? (totalDespesasPagas / totalReceitas) * 100 : 0;

  if (percentualGasto > 80) {
    dicas.push({
      tipo: "alerta",
      titulo: "Gastos muito altos",
      texto: `Você está gastando ${percentualGasto.toFixed(0)}% da sua renda. O ideal é manter abaixo de 80%, guardando pelo menos 20% para reservas.`,
      reducao: null,
    });
  } else if (percentualGasto > 60) {
    dicas.push({
      tipo: "atencao",
      titulo: "Gastos elevados",
      texto: `Seus gastos representam ${percentualGasto.toFixed(0)}% da renda. Tente reduzir para abaixo de 60% para criar uma reserva de emergência.`,
      reducao: null,
    });
  } else {
    dicas.push({
      tipo: "positivo",
      titulo: "Gastos sob controle",
      texto: `Parabéns! Você está gastando apenas ${percentualGasto.toFixed(0)}% da sua renda — bem abaixo do recomendado de 80%.`,
      reducao: null,
    });
  }

  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  if (categorias.length > 0 && totalReceitas > 0) {
    const [nomeCat, valorCat] = categorias[0];
    const pct = (valorCat / totalReceitas) * 100;
    const limites = {
      aluguel: 30, moradia: 30,
      comida: 15, alimentação: 15, alimentacao: 15,
      transporte: 15,
      lazer: 10, entretenimento: 10,
      streaming: 5, assinaturas: 5,
    };
    const limite = limites[nomeCat.toLowerCase()] || 20;
    if (pct > limite) {
      const reducaoIdeal = valorCat - (totalReceitas * limite / 100);
      dicas.push({
        tipo: "alerta",
        titulo: `${nomeCat} acima do ideal`,
        texto: `Você gasta ${fmt(valorCat)} com ${nomeCat} (${pct.toFixed(0)}% da renda). O recomendado é até ${limite}%. Reduzir ${fmt(reducaoIdeal)}/mês liberaria espaço para investimentos.`,
        reducao: reducaoIdeal,
        categoria: nomeCat,
      });
    }
  }

  if (saldoReal < totalDespesasPagas * 3) {
    const meta3meses = totalDespesasPagas * 3;
    dicas.push({
      tipo: "atencao",
      titulo: "Reserva de emergência",
      texto: `Sua reserva ideal seria de ${fmt(meta3meses)} (3 meses de despesas). Guardar ${fmt(totalDespesasPagas * 0.1)}/mês te levaria lá em 30 meses.`,
      reducao: null,
    });
  }

  if (saldoReal > totalReceitas * 0.2) {
    dicas.push({
      tipo: "positivo",
      titulo: "Bom momento para investir",
      texto: `Você tem ${fmt(saldoReal)} de saldo positivo. Considere alocar parte em renda fixa (Tesouro Direto, CDB) ou fundos de emergência.`,
      reducao: null,
    });
  }

  const atrasadas = transacoes.filter((t) => {
    if (t.tipo !== "despesa" || t.status !== "pendente") return false;
    const d = new Date(t.data);
    d.setHours(0, 0, 0, 0);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return d < hoje;
  });
  if (atrasadas.length > 0) {
    const totalAtrasado = atrasadas.reduce((s, t) => s + t.valor, 0);
    dicas.push({
      tipo: "alerta",
      titulo: `${atrasadas.length} despesa(s) atrasada(s)`,
      texto: `Você tem ${fmt(totalAtrasado)} em despesas vencidas. Pague o quanto antes para evitar juros e impacto no seu crédito.`,
      reducao: null,
    });
  }

  return dicas;
}

function CardDica({ dica, indice }) {
  const { formatarValor: fmt } = useMoeda();
  const icones = { alerta: "⚠️", atencao: "💡", positivo: "✅" };
  return (
    <div className={`card-dica card-dica-${dica.tipo}`}
      style={{ animationDelay: `${indice * 0.08}s` }}>
      <div className="dica-topo">
        <span className="dica-icone">{icones[dica.tipo]}</span>
        <h4 className="dica-titulo">{dica.titulo}</h4>
      </div>
      <p className="dica-texto">{dica.texto}</p>
      {dica.reducao && (
        <div className="dica-reducao">
          <span>Redução sugerida:</span>
          <strong>{fmt(dica.reducao)}/mês</strong>
        </div>
      )}
    </div>
  );
}

function AnaliseIA() {
  return (
    <div className="secao-ia">
      <div className="ia-cabecalho">
        <div>
          <h3 className="titulo-secao">Análise por IA</h3>
          <p className="subtitulo-secao">
            Recomendações personalizadas geradas pelo Claude com base nos seus dados.
          </p>
        </div>
      </div>
      <div className="ia-resultado">
        <p className="ia-erro" style={{ background: "var(--cor-acento-fundo-suave)", color: "var(--cor-acento)", borderRadius: 8, padding: "12px 14px" }}>
          ✦ Funcionalidade em breve — a análise por IA requer uma chave de API configurada no servidor. Consulte a documentação para ativar.
        </p>
      </div>
    </div>
  );
}

export default function PaginaRecomendacoes({ transacoes }) {
  const { formatarValor: fmt } = useMoeda();
  const relatorio = calcularRelatorio(transacoes);
  const dicas = gerarDicas(relatorio, transacoes, fmt);

  return (
    <div className="pagina-recomendacoes">
      <section className="secao-dicas">
        <h3 className="titulo-secao">Diagnóstico financeiro</h3>
        <p className="subtitulo-secao">
          Calculado com base nas suas receitas e despesas do período.
        </p>
        <div className="grade-dicas">
          {dicas.map((dica, i) => (
            <CardDica key={i} dica={dica} indice={i} />
          ))}
        </div>
      </section>

      <AnaliseIA relatorio={relatorio} transacoes={transacoes} />
    </div>
  );
}
