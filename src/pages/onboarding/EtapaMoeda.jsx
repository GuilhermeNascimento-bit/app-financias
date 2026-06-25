import { useState } from "react";
import { MOEDAS } from "../../context/MoedaContext";

export default function EtapaMoeda({ moedaInicial, aoAvancar, aoVoltar }) {
  const [selecionada, setSelecionada] = useState(moedaInicial || "BRL");

  function confirmar() {
    aoAvancar(selecionada);
  }

  return (
    <div className="etapa">
      <h2>Qual é a sua moeda?</h2>
      <p className="texto-etapa">
        Escolha a moeda principal que você usa no dia a dia. Você pode trocar nas configurações depois.
      </p>

      <div className="grade-moeda-onboarding">
        {MOEDAS.map((m) => (
          <button
            key={m.codigo}
            type="button"
            className={`card-moeda-onboarding ${selecionada === m.codigo ? "ativo" : ""}`}
            onClick={() => setSelecionada(m.codigo)}
          >
            <span className="moeda-ob-bandeira">{m.bandeira}</span>
            <span className="moeda-ob-simbolo">{m.simbolo}</span>
            <span className="moeda-ob-nome">{m.nome}</span>
          </button>
        ))}
      </div>

      <div className="botoes-navegacao">
        <button type="button" className="botao-secundario" onClick={aoVoltar}>
          Voltar
        </button>
        <button type="button" className="botao-primario" onClick={confirmar}>
          Continuar
        </button>
      </div>
    </div>
  );
}
