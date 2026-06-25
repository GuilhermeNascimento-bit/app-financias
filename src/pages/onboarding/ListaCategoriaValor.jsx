// ListaCategoriaValor.jsx
// Componente reutilizável: uma lista de linhas com "categoria" (texto)
// e "valor" (número), usado nas etapas de renda, despesas fixas e
// despesas variáveis do onboarding.

import { useState } from "react";
import { useMoeda } from "../../context/MoedaContext";

export default function ListaCategoriaValor({
  itens,
  aoMudar,
  categoriasSugeridas,
  placeholderCategoria,
}) {
  const { moeda } = useMoeda();

  function atualizarItem(indice, campo, valor) {
    const novosItens = itens.map((item, i) =>
      i === indice ? { ...item, [campo]: valor } : item
    );
    aoMudar(novosItens);
  }

  function adicionarItem() {
    aoMudar([...itens, { categoria: "", valor: "" }]);
  }

  function removerItem(indice) {
    aoMudar(itens.filter((_, i) => i !== indice));
  }

  function adicionarSugestao(nomeSugestao) {
    const jaExiste = itens.some(
      (item) => item.categoria.toLowerCase() === nomeSugestao.toLowerCase()
    );
    if (jaExiste) return;
    aoMudar([...itens, { categoria: nomeSugestao, valor: "" }]);
  }

  return (
    <div className="lista-categoria-valor">
      {categoriasSugeridas && categoriasSugeridas.length > 0 && (
        <div className="chips-sugestoes">
          {categoriasSugeridas.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              className="chip-sugestao"
              onClick={() => adicionarSugestao(sugestao)}
            >
              + {sugestao}
            </button>
          ))}
        </div>
      )}

      {itens.map((item, indice) => (
        <div className="linha-item" key={indice}>
          <input
            type="text"
            value={item.categoria}
            onChange={(e) => atualizarItem(indice, "categoria", e.target.value)}
            placeholder={placeholderCategoria}
            className="input-categoria"
          />
          <div className="input-valor-wrapper">
            <span className="prefixo-moeda">{moeda.simbolo}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={item.valor}
              onChange={(e) => atualizarItem(indice, "valor", e.target.value)}
              placeholder="0,00"
              className="input-valor"
            />
          </div>
          <button
            type="button"
            className="botao-remover-item"
            onClick={() => removerItem(indice)}
            aria-label="Remover item"
          >
            ×
          </button>
        </div>
      ))}

      <button type="button" className="botao-adicionar-item" onClick={adicionarItem}>
        + Adicionar item
      </button>
    </div>
  );
}
