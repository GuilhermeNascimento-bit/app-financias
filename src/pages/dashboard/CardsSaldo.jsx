import { useMoeda } from "../../context/MoedaContext";

export default function CardsSaldo({ relatorio }) {
  const { formatarValor } = useMoeda();
  const { saldoReal, saldoPrevisto, totalReceitas, totalDespesasPagas } = relatorio;

  const cards = [
    {
      label: "Saldo real",
      valor: saldoReal,
      cor: saldoReal >= 0 ? "positivo" : "negativo",
      descricao: saldoReal >= 0 ? "Você está no azul" : "Você está no vermelho",
    },
    {
      label: "Saldo previsto",
      valor: saldoPrevisto,
      cor: saldoPrevisto >= 0 ? "neutro" : "negativo",
      descricao: "Incluindo pendentes",
    },
    {
      label: "Receitas",
      valor: totalReceitas,
      cor: "positivo",
      descricao: "Total recebido",
    },
    {
      label: "Despesas",
      valor: totalDespesasPagas,
      cor: "negativo",
      descricao: "Total gasto",
    },
  ];

  return (
    <div className="grade-cards-saldo">
      {cards.map((card) => (
        <div key={card.label} className="card-saldo">
          <p className="card-saldo-label">{card.label}</p>
          <p className={`card-saldo-valor ${card.cor}`}>{formatarValor(card.valor)}</p>
          <p className="card-saldo-descricao">{card.descricao}</p>
        </div>
      ))}
    </div>
  );
}
