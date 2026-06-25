import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, orderBy, query
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { adicionarTransacao } from "../../firebase/transacoes";
import { useMoeda } from "../../context/MoedaContext";
import "./recomendacoes.css";

function mesesAteData(dataAlvo) {
  const hoje = new Date();
  const alvo = new Date(dataAlvo);
  return Math.max(1,
    (alvo.getFullYear() - hoje.getFullYear()) * 12 +
    (alvo.getMonth() - hoje.getMonth())
  );
}

const EMOJIS = ["🎯", "✈️", "🏠", "🚗", "💻", "📱", "🎓", "💍", "🏖️", "🎸", "🐾", "💰"];

function ModalNovaMeta({ uid, aoFechar }) {
  const { formatarValor: fmt } = useMoeda();
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [dataAlvo, setDataAlvo] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const meses = dataAlvo ? mesesAteData(dataAlvo) : null;
  const porMes = meses && valor ? (Number(valor) / meses) : null;

  async function salvar() {
    if (!nome.trim()) return setErro("Informe o nome da meta.");
    if (!valor || Number(valor) <= 0) return setErro("Informe o valor da meta.");
    if (!dataAlvo) return setErro("Informe a data alvo.");

    setSalvando(true);
    try {
      await addDoc(collection(db, "usuarios", uid, "metas"), {
        nome: nome.trim(),
        valor: Number(valor),
        dataAlvo,
        emoji,
        acumulado: 0,
        criadoEm: serverTimestamp(),
      });
      aoFechar();
    } catch (err) {
      console.error("Erro ao salvar meta:", err);
      setErro(`Erro ao salvar: ${err.message || "Tente novamente."}`);
      setSalvando(false);
    }
  }

  return (
    <div className="overlay-modal" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal modal-meta">
        <div className="modal-cabecalho">
          <h2>Nova meta</h2>
          <button className="botao-fechar-modal" onClick={aoFechar}>✕</button>
        </div>

        <div className="modal-corpo">
          <div className="campo-modal">
            <label>Ícone</label>
            <div className="grade-emojis">
              {EMOJIS.map((e) => (
                <button key={e} type="button"
                  className={`botao-emoji ${emoji === e ? "ativo" : ""}`}
                  onClick={() => setEmoji(e)}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="campo-modal">
            <label htmlFor="meta-nome">Nome da meta</label>
            <input id="meta-nome" type="text" value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Viagem para Europa, MacBook Pro..." />
          </div>

          <div className="campo-modal">
            <label htmlFor="meta-valor">Valor necessário</label>
            <div className="input-com-prefixo">
              <span>R$</span>
              <input id="meta-valor" type="number" inputMode="decimal"
                value={valor} onChange={(e) => setValor(e.target.value)}
                placeholder="0,00" />
            </div>
          </div>

          <div className="campo-modal">
            <label htmlFor="meta-data">Data alvo</label>
            <input id="meta-data" type="date" value={dataAlvo}
              onChange={(e) => setDataAlvo(e.target.value)}
              min={new Date().toISOString().split("T")[0]} />
          </div>

          {porMes && meses && (
            <div className="preview-meta">
              <span>📅 {meses} {meses === 1 ? "mês" : "meses"} até a meta</span>
              <strong>Guardar {fmt(porMes)}/mês</strong>
            </div>
          )}

          {erro && <p className="erro-modal">{erro}</p>}
        </div>

        <div className="modal-rodape">
          <button className="botao-cancelar" onClick={aoFechar}>Cancelar</button>
          <button className="botao-salvar" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Criar meta"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaginaMetas() {
  const { usuario } = useAuth();
  const { formatarValor: fmt } = useMoeda();
  const uid = usuario?.uid;
  const [metas, setMetas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "usuarios", uid, "metas"),
      orderBy("criadoEm", "desc")
    );
    return onSnapshot(q, (snap) => {
      setMetas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [uid]);

  async function removerMeta(id) {
    if (!window.confirm("Remover esta meta?")) return;
    await deleteDoc(doc(db, "usuarios", uid, "metas", id));
  }

  async function adicionarEconomia(meta) {
    const valor = parseFloat(
      window.prompt(`Quanto você guardou para "${meta.nome}"? (R$)`) || "0"
    );
    if (!valor || valor <= 0) return;
    await Promise.all([
      updateDoc(doc(db, "usuarios", uid, "metas", meta.id), {
        acumulado: (meta.acumulado || 0) + valor,
      }),
      adicionarTransacao(uid, "despesa", {
        categoria: `Meta: ${meta.nome}`,
        data: new Date(),
        valor,
        status: "pago",
      }),
    ]);
  }

  return (
    <div className="pagina-recomendacoes">
      <div className="secao-metas">
        <div className="metas-cabecalho">
          <div>
            <h3 className="titulo-secao">Planejamento de metas</h3>
            <p className="subtitulo-secao">
              Defina objetivos e veja quanto precisa guardar por mês para chegar lá.
            </p>
          </div>
          <button className="botao-nova-meta" onClick={() => setModalAberto(true)}>
            + Nova meta
          </button>
        </div>

        {metas.length === 0 ? (
          <div className="metas-vazio">
            <p>🎯</p>
            <p>Nenhuma meta cadastrada ainda.</p>
            <p>Adicione uma viagem, compra ou reserva para começar a planejar.</p>
          </div>
        ) : (
          <div className="lista-metas">
            {metas.map((meta, i) => {
              const meses = mesesAteData(meta.dataAlvo);
              const guardadoPorMes = (meta.valor - (meta.acumulado || 0)) / meses;
              const progresso = Math.min(100, ((meta.acumulado || 0) / meta.valor) * 100);
              const concluida = progresso >= 100;

              return (
                <div key={meta.id} className={`card-meta ${concluida ? "meta-concluida" : ""}`}
                  style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="meta-topo">
                    <div className="meta-info">
                      <span className="meta-emoji">{meta.emoji || "🎯"}</span>
                      <div>
                        <p className="meta-nome">{meta.nome}</p>
                        <p className="meta-prazo">
                          {new Date(meta.dataAlvo).toLocaleDateString("pt-BR", {
                            month: "long", year: "numeric"
                          })} · {meses} {meses === 1 ? "mês" : "meses"}
                        </p>
                      </div>
                    </div>
                    <div className="meta-acoes">
                      {!concluida && (
                        <button className="botao-acao-meta" onClick={() => adicionarEconomia(meta)} title="Registrar economia">
                          +
                        </button>
                      )}
                      <button className="botao-acao-meta botao-remover-meta"
                        onClick={() => removerMeta(meta.id)} title="Remover">
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="meta-valores">
                    <span className="meta-acumulado">{fmt(meta.acumulado || 0)}</span>
                    <span className="meta-separador">de</span>
                    <span className="meta-total">{fmt(meta.valor)}</span>
                  </div>

                  <div className="barra-meta-fundo">
                    <div className="barra-meta-progresso" style={{ width: `${progresso}%` }} />
                  </div>

                  <div className="meta-rodape">
                    {concluida ? (
                      <span className="meta-badge-concluida">✓ Meta atingida!</span>
                    ) : (
                      <>
                        <span className="meta-por-mes">
                          Guardar <strong>{fmt(Math.max(0, guardadoPorMes))}/mês</strong>
                        </span>
                        <span className="meta-percentual">{progresso.toFixed(0)}%</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalAberto && (
        <ModalNovaMeta uid={uid} aoFechar={() => setModalAberto(false)} />
      )}
    </div>
  );
}
