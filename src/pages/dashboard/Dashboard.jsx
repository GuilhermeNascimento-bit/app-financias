import { useState, useEffect } from "react";
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "../../context/AuthContext";
import { escutarTransacoes, calcularRelatorio } from "../../firebase/transacoes";
import CardsSaldo from "./CardsSaldo";
import GraficoBarras from "./GraficoBarras";
import GraficoPizza from "./GraficoPizza";
import ListaTransacoes from "./ListaTransacoes";
import ModalTransacao from "./ModalTransacao";
import PaginaRecomendacoes from "./PaginaRecomendacoes";
import PaginaMetas from "./PaginaMetas";
import PaginaRelatorios from "./PaginaRelatorios";
import PaginaConfiguracoes from "./PaginaConfiguracoes";
import PaginaFluxo from "./PaginaFluxo";
import Tutorial from "./Tutorial";
import "./dashboard.css";

// ── Definição das abas ────────────────────────────────────────────────────────

const ABAS_DEFAULT = [
  { id: "visao-geral",    icone: "▦", label: "Visão geral" },
  { id: "transacoes",     icone: "↕", label: "Transações" },
  { id: "lembretes",      icone: "◷", label: "Lembretes" },
  { id: "fluxo",          icone: "▤", label: "Fluxo de caixa" },
  { id: "recomendacoes",  icone: "✦", label: "Recomendações" },
  { id: "metas",          icone: "◎", label: "Metas" },
  { id: "relatorios",     icone: "▲", label: "Relatórios" },
  { id: "configuracoes",  icone: "⚙", label: "Configurações" },
];

function carregarAbas() {
  try {
    const salvo = localStorage.getItem("nav-order");
    if (!salvo) return ABAS_DEFAULT;
    const ids = JSON.parse(salvo);
    const ordenadas = ids
      .map((id) => ABAS_DEFAULT.find((a) => a.id === id))
      .filter(Boolean);
    const novas = ABAS_DEFAULT.filter((a) => !ids.includes(a.id));
    return [...ordenadas, ...novas];
  } catch {
    return ABAS_DEFAULT;
  }
}

// ── Item da sidebar arrastável ────────────────────────────────────────────────

function NavItemSortable({ aba, isAtivo, onClick }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: aba.id });

  return (
    <div
      ref={setNodeRef}
      className="nav-item-row"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {/* Handle separado do botão — sem conflito de eventos */}
      <span
        className="nav-drag-handle"
        {...attributes}
        {...listeners}
        title="Arrastar para reordenar"
      >
        ⠿
      </span>
      <button
        className={`nav-item ${isAtivo ? "ativo" : ""}`}
        onClick={onClick}
        data-aba={aba.id}
      >
        <span className="nav-icone">{aba.icone}</span>
        {aba.label}
      </button>
    </div>
  );
}

// ── Avatar (foto ou inicial) ──────────────────────────────────────────────────

function Avatar({ usuario, size = 30 }) {
  if (usuario?.photoURL) {
    return (
      <img
        src={usuario.photoURL}
        alt="perfil"
        style={{
          width: size, height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      className="usuario-avatar"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {(usuario?.displayName || usuario?.email || "U")[0].toUpperCase()}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { usuario, sair } = useAuth();
  const [transacoes, setTransacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [transacaoEditando, setTransacaoEditando] = useState(null);
  const [abaSelecionada, setAbaSelecionada] = useState("visao-geral");
  const [abas, setAbas] = useState(carregarAbas);
  const [tutorialAberto, setTutorialAberto] = useState(
    () => !localStorage.getItem("tutorial-completo")
  );

  const relatorio = calcularRelatorio(transacoes);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    if (!usuario) return;
    const unsubscribe = escutarTransacoes(usuario.uid, (dados) => {
      setTransacoes(dados);
      setCarregando(false);
    });
    return unsubscribe;
  }, [usuario]);

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    setAbas((prev) => {
      const from = prev.findIndex((a) => a.id === active.id);
      const to = prev.findIndex((a) => a.id === over.id);
      const nova = arrayMove(prev, from, to);
      localStorage.setItem("nav-order", JSON.stringify(nova.map((a) => a.id)));
      return nova;
    });
  }

  function fecharTutorial() {
    localStorage.setItem("tutorial-completo", "1");
    setTutorialAberto(false);
  }

  function abrirModalNovo() { setTransacaoEditando(null); setModalAberto(true); }
  function abrirModalEditar(t) { setTransacaoEditando(t); setModalAberto(true); }
  function fecharModal() { setModalAberto(false); setTransacaoEditando(null); }

  const tituloAba = abas.find((a) => a.id === abaSelecionada)?.label ?? "";

  return (
    <div className="layout-dashboard">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-marca">
          <span className="marca-icone-dash">$</span>
          <span className="marca-nome">Finanças</span>
        </div>

        <div className="sidebar-separador" />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={abas.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <nav className="sidebar-nav">
              {abas.map((aba) => (
                <NavItemSortable
                  key={aba.id}
                  aba={aba}
                  isAtivo={abaSelecionada === aba.id}
                  onClick={() => setAbaSelecionada(aba.id)}
                />
              ))}
            </nav>
          </SortableContext>
        </DndContext>

        <div className="sidebar-rodape">
          <Avatar usuario={usuario} size={28} />
          <span className="usuario-nome">
            {usuario?.displayName || usuario?.email}
          </span>
          <button className="botao-sair" onClick={sair} title="Sair">⇥</button>
        </div>
      </aside>

      {/* ── Conteúdo principal ── */}
      <main className="conteudo-dashboard">
        <header className="cabecalho-dashboard">
          <div>
            <h1 className="titulo-pagina">{tituloAba}</h1>
            <p className="subtitulo-pagina">
              {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </div>
          <button className="botao-nova-transacao" onClick={abrirModalNovo}>
            + Nova transação
          </button>
        </header>

        {carregando ? (
          <div className="estado-carregando"><p>Carregando seus dados...</p></div>
        ) : (
          <>
            {abaSelecionada === "visao-geral" && (
              <div className="grade-dashboard">
                <CardsSaldo relatorio={relatorio} />
                <div className="linha-graficos">
                  <div className="cartao-dashboard cartao-grafico-barras">
                    <h3 className="titulo-cartao">Receitas x Despesas</h3>
                    <GraficoBarras transacoes={transacoes} />
                  </div>
                  <div className="cartao-dashboard cartao-grafico-pizza">
                    <h3 className="titulo-cartao">Despesas por categoria</h3>
                    <GraficoPizza despesas={relatorio.despesas} />
                  </div>
                </div>
                <div className="cartao-dashboard">
                  <h3 className="titulo-cartao">Transações recentes</h3>
                  <ListaTransacoes
                    transacoes={transacoes.slice(0, 5)}
                    uid={usuario.uid}
                    aoEditar={abrirModalEditar}
                    resumido
                  />
                </div>
              </div>
            )}
            {abaSelecionada === "transacoes" && (
              <div className="cartao-dashboard">
                <ListaTransacoes transacoes={transacoes} uid={usuario.uid} aoEditar={abrirModalEditar} />
              </div>
            )}
            {abaSelecionada === "lembretes" && (
              <div className="cartao-dashboard">
                <h3 className="titulo-cartao">Pendências e lembretes</h3>
                <ListaTransacoes
                  transacoes={transacoes.filter((t) => t.status === "pendente")}
                  uid={usuario.uid}
                  aoEditar={abrirModalEditar}
                  modoLembrete
                />
              </div>
            )}
            {abaSelecionada === "fluxo" && <PaginaFluxo transacoes={transacoes} />}
            {abaSelecionada === "recomendacoes" && <PaginaRecomendacoes transacoes={transacoes} />}
            {abaSelecionada === "metas" && <PaginaMetas />}
            {abaSelecionada === "relatorios" && <PaginaRelatorios transacoes={transacoes} />}
            {abaSelecionada === "configuracoes" && <PaginaConfiguracoes />}
          </>
        )}
      </main>

      {/* ── Navbar mobile ── */}
      <nav className="navbar-mobile">
        {abas.slice(0, 4).map((aba) => (
          <button
            key={aba.id}
            className={`nav-mobile-item ${abaSelecionada === aba.id ? "ativo" : ""}`}
            onClick={() => setAbaSelecionada(aba.id)}
          >
            <span>{aba.icone}</span>
            <span>{aba.label.split(" ")[0]}</span>
          </button>
        ))}
        <button className="nav-mobile-fab" onClick={abrirModalNovo}>+</button>
        {abas.slice(4).map((aba) => (
          <button
            key={aba.id}
            className={`nav-mobile-item ${abaSelecionada === aba.id ? "ativo" : ""}`}
            onClick={() => setAbaSelecionada(aba.id)}
          >
            <span>{aba.icone}</span>
            <span>{aba.label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>

      {tutorialAberto && (
        <Tutorial
          aoFechar={fecharTutorial}
          onNavegar={setAbaSelecionada}
        />
      )}

      {modalAberto && (
        <ModalTransacao
          uid={usuario.uid}
          transacao={transacaoEditando}
          aoFechar={fecharModal}
        />
      )}
    </div>
  );
}
