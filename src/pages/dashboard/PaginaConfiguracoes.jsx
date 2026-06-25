import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "../../firebase/firebaseConfig";
import { useMoeda, MOEDAS } from "../../context/MoedaContext";
import "./configuracoes.css";

// ── Paleta de cores de destaque ───────────────────────────────────────────────

export const PALETA_CORES = [
  { id: "verde",   nome: "Verde",   acento: "#1d9e75", hover: "#0f6e56", suave: "rgba(29,158,117,0.12)" },
  { id: "azul",    nome: "Azul",    acento: "#2563eb", hover: "#1d4ed8", suave: "rgba(37,99,235,0.12)" },
  { id: "roxo",    nome: "Roxo",    acento: "#7c3aed", hover: "#6d28d9", suave: "rgba(124,58,237,0.12)" },
  { id: "rosa",    nome: "Rosa",    acento: "#db2777", hover: "#be185d", suave: "rgba(219,39,119,0.12)" },
  { id: "laranja", nome: "Laranja", acento: "#ea580c", hover: "#c2410c", suave: "rgba(234,88,12,0.12)" },
  { id: "dourado", nome: "Dourado", acento: "#b45309", hover: "#92400e", suave: "rgba(180,83,9,0.12)" },
];

export function aplicarCor(cor) {
  const r = document.documentElement;
  r.style.setProperty("--cor-acento", cor.acento);
  r.style.setProperty("--cor-acento-hover", cor.hover);
  r.style.setProperty("--cor-acento-fundo-suave", cor.suave);
  localStorage.setItem("cor-acento", JSON.stringify(cor));
}

// ── Temas ─────────────────────────────────────────────────────────────────────

const TEMAS = [
  { valor: "auto",   icone: "⚙️", label: "Automático" },
  { valor: "claro",  icone: "☀️", label: "Claro" },
  { valor: "escuro", icone: "🌙", label: "Escuro" },
];

function aplicarTema(tema) {
  if (tema === "auto") document.documentElement.removeAttribute("data-tema");
  else document.documentElement.setAttribute("data-tema", tema);
  localStorage.setItem("tema", tema);
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function PaginaConfiguracoes() {
  const { usuario, sair } = useAuth();
  const fotoInputRef = useRef(null);

  const [nome, setNome] = useState(usuario?.displayName || "");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [msgNome, setMsgNome] = useState(null);

  const [msgSenha, setMsgSenha] = useState(null);

  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [msgFoto, setMsgFoto] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(usuario?.photoURL || null);

  const { moeda, setMoeda } = useMoeda();
  const [tema, setTema] = useState(() => localStorage.getItem("tema") || "auto");
  const [corId, setCorId] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cor-acento"))?.id || "verde"; }
    catch { return "verde"; }
  });

  // Perfil — salvar nome
  async function salvarNome() {
    if (!nome.trim()) return;
    setSalvandoNome(true);
    setMsgNome(null);
    try {
      await updateProfile(auth.currentUser, { displayName: nome.trim() });
      setMsgNome({ tipo: "sucesso", texto: "Nome atualizado!" });
    } catch {
      setMsgNome({ tipo: "erro", texto: "Erro ao atualizar o nome." });
    } finally {
      setSalvandoNome(false);
    }
  }

  // Foto de perfil — upload para Firebase Storage
  async function handleFotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsgFoto({ tipo: "erro", texto: "Selecione uma imagem (JPG, PNG, etc.)." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsgFoto({ tipo: "erro", texto: "A imagem deve ter no máximo 5 MB." });
      return;
    }

    setUploadandoFoto(true);
    setMsgFoto(null);
    try {
      const storageRef = ref(storage, `usuarios/${usuario.uid}/perfil`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser, { photoURL: url });
      setFotoUrl(url);
      setMsgFoto({ tipo: "sucesso", texto: "Foto atualizada!" });
    } catch (err) {
      console.error("Erro no upload:", err);
      setMsgFoto({ tipo: "erro", texto: "Erro ao enviar a foto. Verifique as regras do Storage." });
    } finally {
      setUploadandoFoto(false);
    }
  }

  // Segurança — reset de senha
  async function enviarResetSenha() {
    setMsgSenha(null);
    try {
      await sendPasswordResetEmail(auth, usuario.email);
      setMsgSenha({ tipo: "sucesso", texto: `Link enviado para ${usuario.email}.` });
    } catch {
      setMsgSenha({ tipo: "erro", texto: "Erro ao enviar o e-mail. Tente novamente." });
    }
  }

  // Aparência — cor
  function mudarCor(cor) {
    setCorId(cor.id);
    aplicarCor(cor);
  }

  // Aparência — tema
  function mudarTema(t) {
    setTema(t);
    aplicarTema(t);
  }

  return (
    <div className="pagina-configuracoes">

      {/* ── Perfil ── */}
      <div className="secao-config">
        <h3 className="titulo-config">Perfil</h3>

        {/* Foto de perfil */}
        <div className="foto-perfil-wrapper">
          <div className="foto-perfil-preview">
            {fotoUrl
              ? <img src={fotoUrl} alt="perfil" className="foto-perfil-img" />
              : <span className="foto-perfil-inicial">
                  {(usuario?.displayName || usuario?.email || "U")[0].toUpperCase()}
                </span>
            }
            <button
              className="foto-perfil-overlay"
              onClick={() => fotoInputRef.current?.click()}
              disabled={uploadandoFoto}
              title="Alterar foto"
            >
              {uploadandoFoto ? "…" : "📷"}
            </button>
          </div>
          <div>
            <p className="linha-config-titulo">Foto de perfil</p>
            <p className="linha-config-desc">JPG ou PNG · máx. 5 MB</p>
            {msgFoto && (
              <p className={`mensagem-config ${msgFoto.tipo}`} style={{ marginTop: 6 }}>
                {msgFoto.texto}
              </p>
            )}
          </div>
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFotoChange}
          />
        </div>

        <div className="campo-config">
          <label htmlFor="cfg-nome">Nome de exibição</label>
          <input
            id="cfg-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && salvarNome()}
            placeholder="Seu nome"
          />
        </div>
        <div className="campo-config">
          <label>E-mail</label>
          <input type="email" value={usuario?.email || ""} disabled />
        </div>
        {msgNome && <p className={`mensagem-config ${msgNome.tipo}`}>{msgNome.texto}</p>}
        <button
          className="botao-config"
          onClick={salvarNome}
          disabled={salvandoNome || !nome.trim()}
        >
          {salvandoNome ? "Salvando..." : "Salvar nome"}
        </button>
      </div>

      {/* ── Aparência ── */}
      <div className="secao-config">
        <h3 className="titulo-config">Aparência</h3>

        <div>
          <p className="label-config">Cor de destaque</p>
          <div className="grade-cores">
            {PALETA_CORES.map((cor) => (
              <button
                key={cor.id}
                className={`botao-cor ${corId === cor.id ? "ativo" : ""}`}
                style={{ "--cor-botao": cor.acento }}
                onClick={() => mudarCor(cor)}
                title={cor.nome}
              >
                {corId === cor.id && <span className="cor-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label-config">Tema</p>
          <div className="grade-tema">
            {TEMAS.map((t) => (
              <button
                key={t.valor}
                className={`botao-tema ${tema === t.valor ? "ativo" : ""}`}
                onClick={() => mudarTema(t.valor)}
              >
                <span className="icone-tema">{t.icone}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Moeda ── */}
      <div className="secao-config">
        <h3 className="titulo-config">Moeda</h3>
        <div className="grade-moedas">
          {MOEDAS.map((m) => (
            <button
              key={m.codigo}
              className={`botao-moeda ${moeda.codigo === m.codigo ? "ativo" : ""}`}
              onClick={() => setMoeda(m.codigo)}
            >
              <span className="moeda-bandeira">{m.bandeira}</span>
              <span className="moeda-simbolo">{m.simbolo}</span>
              <span className="moeda-nome">{m.nome}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Abas da sidebar ── */}
      <div className="secao-config">
        <h3 className="titulo-config">Ordem das abas</h3>
        <p className="linha-config-desc" style={{ marginBottom: 4 }}>
          Arraste as abas na barra lateral para reordená-las. A posição é salva automaticamente.
        </p>
        <div className="aviso-ordem-abas">
          ⠿ &nbsp;Pegue pelo ícone de grip ao lado de cada item na barra lateral e arraste para cima ou para baixo.
        </div>
      </div>

      {/* ── Segurança ── */}
      <div className="secao-config">
        <h3 className="titulo-config">Segurança</h3>
        <div className="linha-config">
          <div className="linha-config-info">
            <p className="linha-config-titulo">Alterar senha</p>
            <p className="linha-config-desc">Enviaremos um link de redefinição para o seu e-mail.</p>
          </div>
          <button className="botao-config-secundario" onClick={enviarResetSenha}>
            Enviar link
          </button>
        </div>
        {msgSenha && <p className={`mensagem-config ${msgSenha.tipo}`}>{msgSenha.texto}</p>}
      </div>

      {/* ── Conta ── */}
      <div className="secao-config">
        <h3 className="titulo-config">Conta</h3>
        <div className="linha-config">
          <div className="linha-config-info">
            <p className="linha-config-titulo">Tour de apresentação</p>
            <p className="linha-config-desc">Rever o tutorial de boas-vindas do app.</p>
          </div>
          <button
            className="botao-config-secundario"
            onClick={() => {
              localStorage.removeItem("tutorial-completo");
              window.location.reload();
            }}
          >
            Rever tour
          </button>
        </div>
        <div className="linha-config">
          <div className="linha-config-info">
            <p className="linha-config-titulo">Sair da conta</p>
            <p className="linha-config-desc">Você precisará fazer login novamente.</p>
          </div>
          <button className="botao-config-perigo" onClick={sair}>Sair</button>
        </div>
      </div>

    </div>
  );
}
