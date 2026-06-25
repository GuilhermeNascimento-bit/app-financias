// EtapaBoasVindas.jsx
import { useState } from "react";

export default function EtapaBoasVindas({ nome, aoAvancar }) {
  return (
    <div className="etapa">
      <div className="icone-boas-vindas">$</div>
      <h2>Bem-vindo{nome ? `, ${nome.split(" ")[0]}` : ""}!</h2>
      <p className="texto-etapa">
        Vamos fazer algumas perguntas rápidas sobre suas receitas e despesas
        do mês para já montar seu painel financeiro com dados reais.
      </p>
      <p className="texto-etapa texto-secundario">
        Leva menos de 2 minutos, e você pode editar tudo depois.
      </p>
      <button type="button" className="botao-primario" onClick={aoAvancar}>
        Vamos começar
      </button>
    </div>
  );
}
