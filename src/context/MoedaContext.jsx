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
    const num = Number(valor) || 0;
    const negativo = num < 0;
    const abs = Math.abs(num);
    const fixed = abs.toFixed(2);
    const [intStr, decStr] = fixed.split(".");

    // BRL e EUR: separador de milhar = "." e decimal = ","
    // USD: separador de milhar = "," e decimal = "."
    const sepMilhar = moeda.codigo === "USD" ? "," : ".";
    const sepDecimal = moeda.codigo === "USD" ? "." : ",";

    const intFormatado = intStr.replace(/\B(?=(\d{3})+(?!\d))/g, sepMilhar);
    const resultado = `${moeda.simbolo} ${intFormatado}${sepDecimal}${decStr}`;
    return negativo ? `-${resultado}` : resultado;
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
