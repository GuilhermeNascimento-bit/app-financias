// EtapaDespesasVariaveis.jsx
import { useState } from "react";
import ListaCategoriaValor from "./ListaCategoriaValor";

const SUGESTOES = ["Comida", "Transporte", "Lazer", "Saúde", "Compras"];

export default function EtapaDespesasVariaveis({ valoresIniciais, aoAvancar, aoVoltar }) {
  const [itens, setItens] = useState(
    valoresIniciais.length > 0 ? valoresIniciais : [{ categoria: "Comida", valor: "" }]
  );

  function continuar() {
    const itensValidos = itens
      .filter((item) => item.categoria.trim() && Number(item.valor) > 0)
      .map((item) => ({ categoria: item.categoria.trim(), valor: Number(item.valor) }));
    aoAvancar(itensValidos);
  }

  return (
    <div className="etapa">
      <h2>Despesas variáveis do mês</h2>
      <p className="texto-etapa">
        Gastos do dia a dia que costumam mudar de valor, como comida e transporte.
      </p>

      <ListaCategoriaValor
        itens={itens}
        aoMudar={setItens}
        categoriasSugeridas={SUGESTOES}
        placeholderCategoria="Ex: Comida"
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
