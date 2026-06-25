import { useState } from "react";
import { useMoeda } from "../../context/MoedaContext";

const SUGESTOES = [
  { nome: "Salário",           tipo: "receita", dia: 5,  formaPagamento: "dinheiro" },
  { nome: "Aluguel",           tipo: "despesa", dia: 10, formaPagamento: "dinheiro" },
  { nome: "Cartão de crédito", tipo: "despesa", dia: 7,  formaPagamento: "credito"  },
  { nome: "Internet",          tipo: "despesa", dia: 15, formaPagamento: "debito"   },
  { nome: "Streaming",         tipo: "despesa", dia: 1,  formaPagamento: "credito"  },
  { nome: "Academia",          tipo: "despesa", dia: 1,  formaPagamento: "dinheiro" },
];

const FORMAS = [
  { id: "dinheiro", label: "Dinheiro" },
  { id: "debito",   label: "Débito"   },
  { id: "credito",  label: "Crédito"  },
];

export default function EtapaRecorrentes({ valoresIniciais, aoAvancar, aoVoltar }) {
  const { moeda } = useMoeda();

  const [lista, setLista]               = useState(valoresIniciais || []);
  const [tipo, setTipo]                 = useState("despesa");
  const [nome, setNome]                 = useState("");
  const [valor, setValor]               = useState("");
  const [dia, setDia]                   = useState("");
  const [formaPagamento, setForma]      = useState("dinheiro");
  const [erro, setErro]                 = useState("");

  function aplicarSugestao(s) {
    setTipo(s.tipo);
    setNome(s.nome);
    setDia(String(s.dia));
    setForma(s.formaPagamento);
    setErro("");
  }

  function adicionar() {
    if (!nome.trim()) return setErro("Informe um nome.");
    if (!valor || Number(valor) <= 0) return setErro("Informe um valor válido.");
    const diaNum = Number(dia);
    if (!diaNum || diaNum < 1 || diaNum > 31) return setErro("Dia inválido (1–31).");

    setLista((ant) => [
      ...ant,
      {
        nome: nome.trim(),
        tipo,
        valor: Number(valor),
        dia: diaNum,
        formaPagamento: tipo === "despesa" ? formaPagamento : "dinheiro",
      },
    ]);
    setNome("");
    setValor("");
    setDia("");
    setErro("");
  }

  function remover(i) {
    setLista((ant) => ant.filter((_, idx) => idx !== i));
  }

  return (
    <div className="etapa">
      <h2>Pagamentos fixos mensais</h2>
      <p className="texto-etapa">
        Adicione tudo que se repete todo mês — salário, aluguel, fatura do cartão...
      </p>

      {/* Sugestões rápidas */}
      <div className="chips-sugestoes">
        {SUGESTOES.map((s) => (
          <button key={s.nome} className="chip-sugestao" type="button" onClick={() => aplicarSugestao(s)}>
            {s.nome}
          </button>
        ))}
      </div>

      {/* Formulário */}
      <div className="form-recorrente-ob">

        <div className="toggle-tipo">
          <button type="button" className={`toggle-opcao ${tipo === "receita" ? "ativo" : ""}`} onClick={() => setTipo("receita")}>↑ Receita</button>
          <button type="button" className={`toggle-opcao ${tipo === "despesa" ? "ativo" : ""}`} onClick={() => setTipo("despesa")}>↓ Despesa</button>
        </div>

        <input
          className="input-categoria"
          placeholder="Nome (ex: Cartão de crédito)"
          value={nome}
          onChange={(e) => { setNome(e.target.value); setErro(""); }}
        />

        <div className="linha-recorrente-ob">
          <div className="input-valor-wrapper">
            <span className="prefixo-moeda">{moeda.simbolo}</span>
            <input
              className="input-valor"
              type="number"
              placeholder="Valor"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
          <div className="input-dia-wrapper">
            <span className="prefixo-dia">Dia</span>
            <input
              className="input-valor"
              type="number"
              placeholder="07"
              min="1"
              max="31"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
            />
          </div>
        </div>

        {tipo === "despesa" && (
          <div className="toggle-tipo">
            {FORMAS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`toggle-opcao ${formaPagamento === f.id ? "ativo" : ""}`}
                onClick={() => setForma(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {erro && <p className="mensagem-erro">{erro}</p>}

        <button
          type="button"
          className="botao-adicionar-rec"
          onClick={adicionar}
        >
          + Adicionar
        </button>
      </div>

      {/* Lista de itens adicionados */}
      {lista.length > 0 && (
        <div className="lista-rec-ob">
          {lista.map((item, i) => (
            <div key={i} className={`item-rec-ob item-rec-${item.tipo}`}>
              <span className="item-rec-seta">{item.tipo === "receita" ? "↑" : "↓"}</span>
              <div className="item-rec-texto">
                <span className="item-rec-nome">{item.nome}</span>
                <span className="item-rec-sub">
                  Todo dia {item.dia}
                  {item.tipo === "despesa" && item.formaPagamento !== "dinheiro"
                    ? ` · ${item.formaPagamento === "credito" ? "Crédito" : "Débito"}`
                    : ""}
                </span>
              </div>
              <span className="item-rec-valor">
                {moeda.simbolo} {item.valor.toFixed(2)}
              </span>
              <button className="botao-remover-item" onClick={() => remover(i)}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="botoes-navegacao">
        <button className="botao-secundario" onClick={aoVoltar}>Voltar</button>
        <button className="botao-primario" onClick={() => aoAvancar(lista)}>
          {lista.length === 0 ? "Pular" : "Continuar"}
        </button>
      </div>
    </div>
  );
}
