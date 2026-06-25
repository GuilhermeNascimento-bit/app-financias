// EtapaRenda.jsx
import { useState } from "react";
import ListaCategoriaValor from "./ListaCategoriaValor";

const SUGESTOES = ["Salário", "Freelance", "Aluguel recebido", "Outro"];

export default function EtapaRenda({ valoresIniciais, aoAvancar, aoVoltar }) {
  const [itens, setItens] = useState(
    valoresIniciais.length > 0 ? valoresIniciais : [{ categoria: "Salário", valor: "" }]
  );

  function continuar() {
    const itensValidos = itens
      .filter((item) => item.categoria.trim() && Number(item.valor) > 0)
      .map((item) => ({ categoria: item.categoria.trim(), valor: Number(item.valor) }));
    aoAvancar(itensValidos);
  }

  const temAlgumValor = itens.some((item) => Number(item.valor) > 0);

  return (
    <div className="etapa">
      <h2>Qual sua renda mensal?</h2>
      <p className="texto-etapa">
        Inclua salário e qualquer outra fonte de renda recorrente.
      </p>

      <ListaCategoriaValor
        itens={itens}
        aoMudar={setItens}
        categoriasSugeridas={SUGESTOES}
        placeholderCategoria="Ex: Salário"
      />

      <div className="botoes-navegacao">
        <button type="button" className="botao-secundario" onClick={aoVoltar}>
          Voltar
        </button>
        <button
          type="button"
          className="botao-primario"
          onClick={continuar}
          disabled={!temAlgumValor}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
