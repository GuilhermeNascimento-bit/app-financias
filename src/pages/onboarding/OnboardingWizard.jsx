import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMoeda } from "../../context/MoedaContext";
import { adicionarTransacao } from "../../firebase/transacoes";
import { adicionarRecorrente } from "../../firebase/recorrentes";
import EtapaBoasVindas from "./EtapaBoasVindas";
import EtapaMoeda from "./EtapaMoeda";
import EtapaRenda from "./EtapaRenda";
import EtapaDespesasFixas from "./EtapaDespesasFixas";
import EtapaDespesasVariaveis from "./EtapaDespesasVariaveis";
import EtapaRecorrentes from "./EtapaRecorrentes";
import EtapaResumo from "./EtapaResumo";
import "./onboarding.css";

const TOTAL_ETAPAS = 7;

export default function OnboardingWizard({ aoConcluir }) {
  const { usuario } = useAuth();
  const { setMoeda } = useMoeda();

  const [etapaAtual, setEtapaAtual] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [dados, setDados] = useState({
    moeda: "BRL",
    renda: [],
    despesasFixas: [],
    despesasVariaveis: [],
    recorrentes: [],
  });

  function avancar() {
    setEtapaAtual((e) => Math.min(e + 1, TOTAL_ETAPAS - 1));
  }

  function voltar() {
    setEtapaAtual((e) => Math.max(e - 1, 0));
  }

  function atualizarDados(secao, valores) {
    setDados((ant) => ({ ...ant, [secao]: valores }));
  }

  async function confirmarESalvar() {
    setSalvando(true);
    setErro("");

    try {
      // Aplica a moeda escolhida antes de ir para o dashboard
      setMoeda(dados.moeda);

      const hoje = new Date();
      const todasTransacoes = [
        ...dados.renda.map((item) => ({ ...item, tipo: "receita" })),
        ...dados.despesasFixas.map((item) => ({ ...item, tipo: "despesa" })),
        ...dados.despesasVariaveis.map((item) => ({ ...item, tipo: "despesa" })),
      ].filter((item) => item.valor > 0);

      for (const transacao of todasTransacoes) {
        await adicionarTransacao(usuario.uid, transacao.tipo, {
          categoria: transacao.categoria,
          data: hoje,
          valor: transacao.valor,
          status: "pago",
        });
      }

      for (const rec of dados.recorrentes) {
        await adicionarRecorrente(usuario.uid, {
          nome: rec.nome,
          tipo: rec.tipo,
          valor: rec.valor,
          dia: rec.dia,
          formaPagamento: rec.formaPagamento,
        });
      }

      aoConcluir();
    } catch {
      setErro("Não foi possível salvar seus dados. Tente novamente.");
      setSalvando(false);
    }
  }

  const etapas = [
    <EtapaBoasVindas key="boas-vindas" nome={usuario?.displayName} aoAvancar={avancar} />,

    <EtapaMoeda
      key="moeda"
      moedaInicial={dados.moeda}
      aoAvancar={(codigo) => {
        atualizarDados("moeda", codigo);
        avancar();
      }}
      aoVoltar={voltar}
    />,

    <EtapaRenda
      key="renda"
      valoresIniciais={dados.renda}
      aoAvancar={(valores) => { atualizarDados("renda", valores); avancar(); }}
      aoVoltar={voltar}
    />,

    <EtapaDespesasFixas
      key="despesas-fixas"
      valoresIniciais={dados.despesasFixas}
      aoAvancar={(valores) => { atualizarDados("despesasFixas", valores); avancar(); }}
      aoVoltar={voltar}
    />,

    <EtapaDespesasVariaveis
      key="despesas-variaveis"
      valoresIniciais={dados.despesasVariaveis}
      aoAvancar={(valores) => { atualizarDados("despesasVariaveis", valores); avancar(); }}
      aoVoltar={voltar}
    />,

    <EtapaRecorrentes
      key="recorrentes"
      valoresIniciais={dados.recorrentes}
      aoAvancar={(valores) => { atualizarDados("recorrentes", valores); avancar(); }}
      aoVoltar={voltar}
    />,

    <EtapaResumo
      key="resumo"
      dados={dados}
      salvando={salvando}
      erro={erro}
      aoConfirmar={confirmarESalvar}
      aoVoltar={voltar}
    />,
  ];

  return (
    <div className="tela-onboarding">
      <div className="cartao-onboarding">
        <div className="barra-progresso">
          {Array.from({ length: TOTAL_ETAPAS }).map((_, i) => (
            <div
              key={i}
              className={`segmento-progresso ${i <= etapaAtual ? "ativo" : ""}`}
            />
          ))}
        </div>
        {etapas[etapaAtual]}
      </div>
    </div>
  );
}
