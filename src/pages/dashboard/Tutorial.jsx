import { useState, useEffect, useCallback } from "react";
import "./tutorial.css";

const PASSOS = [
  {
    alvo: "visao-geral",
    titulo: "Bem-vindo ao Finanças!",
    descricao: "Vamos fazer um tour rápido. Aqui na Visão Geral você tem um resumo completo: saldo atual, gráficos de receitas e despesas e suas transações recentes.",
  },
  {
    alvo: "transacoes",
    titulo: "↕ Transações",
    descricao: "Registre todas as suas receitas e despesas. Use o botão '+ Nova transação' no topo para adicionar — agora com forma de pagamento (dinheiro, débito ou crédito) e parcelamento automático.",
  },
  {
    alvo: "lembretes",
    titulo: "◷ Lembretes",
    descricao: "Não perca nenhum pagamento! Aqui ficam reunidas todas as despesas pendentes e atrasadas, incluindo parcelas futuras de compras no crédito.",
  },
  {
    alvo: "fluxo",
    titulo: "▤ Fluxo de caixa",
    descricao: "Veja exatamente quanto você vai ter em cada dia do mês. Cadastre pagamentos fixos (salário, aluguel, assinaturas) e confirme quando receber ou pagar.",
  },
  {
    alvo: "recomendacoes",
    titulo: "✦ Recomendações",
    descricao: "Diagnóstico financeiro automático calculado com os seus dados reais — gastos altos, reserva de emergência e mais. Também tem análise personalizada por IA.",
  },
  {
    alvo: "metas",
    titulo: "◎ Metas",
    descricao: "Defina objetivos como uma viagem, um equipamento ou uma reserva. O app calcula quanto você precisa guardar por mês e mostra seu progresso.",
  },
  {
    alvo: "relatorios",
    titulo: "▲ Relatórios",
    descricao: "Analise seus gastos por período, veja a evolução do saldo mês a mês, ranking de categorias e exporte um relatório completo em PDF.",
  },
  {
    alvo: "configuracoes",
    titulo: "⚙ Configurações",
    descricao: "Personalize o app do seu jeito: escolha a cor de destaque, adicione uma foto de perfil e reordene as abas do menu arrastando-as.",
  },
];

export default function Tutorial({ aoFechar, onNavegar }) {
  const [passo, setPasso] = useState(0);
  const [rect, setRect] = useState(null);

  const atual = PASSOS[passo];

  const atualizarRect = useCallback(() => {
    const el = document.querySelector(`[data-aba="${atual.alvo}"]`);
    if (el) {
      setRect(el.getBoundingClientRect());
      onNavegar?.(atual.alvo);
    }
  }, [atual.alvo, onNavegar]);

  useEffect(() => {
    // pequeno delay para o DOM atualizar após navegação
    const t = setTimeout(atualizarRect, 60);
    window.addEventListener("resize", atualizarRect);
    return () => { clearTimeout(t); window.removeEventListener("resize", atualizarRect); };
  }, [atualizarRect]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") aoFechar();
      if (e.key === "ArrowRight") avancar();
      if (e.key === "ArrowLeft") voltar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function avancar() {
    if (passo < PASSOS.length - 1) setPasso((p) => p + 1);
    else aoFechar();
  }

  function voltar() {
    if (passo > 0) setPasso((p) => p - 1);
  }

  // Posiciona o card à direita do spotlight; se não couber, à esquerda
  let cardStyle = {};
  if (rect) {
    const cardW = 308;
    const margemH = 20;
    const colunaDir = rect.right + margemH;
    const colunaEsq = rect.left - margemH - cardW;
    const left = colunaDir + cardW < window.innerWidth ? colunaDir : colunaEsq;
    const top = Math.max(16, Math.min(rect.top, window.innerHeight - 260));
    cardStyle = { top, left };
  } else {
    cardStyle = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }

  return (
    <div className="tutorial-overlay">
      {/* Escuridão com buraco no spotlight */}
      {rect && (
        <div
          className="tutorial-spotlight"
          style={{
            top:    rect.top    - 6,
            left:   rect.left   - 10,
            width:  rect.width  + 20,
            height: rect.height + 12,
          }}
        />
      )}

      {/* Card do passo */}
      <div className="tutorial-card" style={cardStyle} key={passo}>
        {/* Barra de progresso */}
        <div className="tutorial-barra-prog">
          {PASSOS.map((_, i) => (
            <div
              key={i}
              className={`tutorial-seg ${i < passo ? "feito" : i === passo ? "ativo" : ""}`}
              onClick={() => setPasso(i)}
            />
          ))}
        </div>

        <p className="tutorial-contador">{passo + 1} de {PASSOS.length}</p>
        <h3 className="tutorial-titulo">{atual.titulo}</h3>
        <p className="tutorial-descricao">{atual.descricao}</p>

        <div className="tutorial-rodape">
          <button className="tutorial-pular" onClick={aoFechar}>
            Pular tour
          </button>
          <div className="tutorial-nav">
            {passo > 0 && (
              <button className="tutorial-btn-voltar" onClick={voltar}>← Voltar</button>
            )}
            <button className="tutorial-btn-avancar" onClick={avancar}>
              {passo < PASSOS.length - 1 ? "Próximo →" : "Concluir ✓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
