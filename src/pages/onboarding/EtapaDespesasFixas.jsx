// EtapaDespesasFixas.jsx
import { useState } from "react";
import ListaCategoriaValor from "./ListaCategoriaValor";

const SUGESTOES = ["Aluguel", "Internet", "Energia", "Água", "Telefone", "Streaming"];

export default function EtapaDespesasFixas({ valoresIniciais, aoAvancar, aoVoltar }) {
  const [itens, setItens] = useState(
    valoresIniciais.length > 0 ? valoresIniciais : [{ categoria: "Aluguel", valor: "" }]
  );

  function continuar() {
    const itensValidos = itens
      .filter((item) => item.categoria.trim() && Number(item.valor) > 0)
      .map((item) => ({ categoria: item.categoria.trim(), valor: Number(item.valor) }));
    aoAvancar(itensValidos);
  }

  return (
    <div className="etapa">
      <h2>Despesas fixas do mês</h2>
      <p className="texto-etapa">
        Contas que se repetem todo mês, como aluguel e assinaturas.
      </p>

      <ListaCategoriaValor
        itens={itens}
        aoMudar={setItens}
        categoriasSugeridas={SUGESTOES}
        placeholderCategoria="Ex: Aluguel"
      />

      <div className="botoes-navegacao">
        <button type="button" className="botao-secundario" onClick={aoVoltar}>
          Voltar
        </button>
        <button type="button" className="botao-primario" onClick={continuar}>
          Continuar
        </button>
      </div>
    </div>
  );
}
