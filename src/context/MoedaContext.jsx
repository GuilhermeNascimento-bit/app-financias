import { createContext, useContext, useState } from "react";

export const MOEDAS = [
  { codigo: "BRL", locale: "pt-BR", simbolo: "R$", nome: "Real",   bandeira: "🇧🇷" },
  { codigo: "USD", locale: "en-US", simbolo: "$",   nome: "Dólar",  bandeira: "🇺🇸" },
  { codigo: "EUR", locale: "de-DE", simbolo: "€",   nome: "Euro",   bandeira: "🇪🇺" },
];

const MoedaContext = createContext(null);

export function MoedaProvider({ children }) {
  const [codigo, setCodigo] = useState(
    () => localStorage.getItem("moeda") || "BRL"
  );

  const moeda = MOEDAS.find((m) => m.codigo === codigo) || MOEDAS[0];

  function setMoeda(novoCodigo) {
    localStorage.setItem("moeda", novoCodigo);
    setCodigo(novoCodigo);
  }

  function formatarValor(valor) {
    return Number(valor).toLocaleString(moeda.locale, {
      style: "currency",
      currency: moeda.codigo,
    });
  }

  return (
    <MoedaContext.Provider value={{ moeda, setMoeda, formatarValor }}>
      {children}
    </MoedaContext.Provider>
  );
}

export function useMoeda() {
  return useContext(MoedaContext);
}
