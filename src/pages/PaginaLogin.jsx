// PaginaLogin.jsx
// Tela única que alterna entre "Entrar" e "Criar conta".
// Usa o AuthContext para falar com o Firebase Auth.

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./PaginaLogin.css";

export default function PaginaLogin() {
  const { entrar, cadastrar } = useAuth();

  const [modo, setModo] = useState("entrar"); // "entrar" | "cadastrar"
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const ehCadastro = modo === "cadastrar";

  function alternarModo() {
    setErro("");
    setModo(ehCadastro ? "entrar" : "cadastrar");
  }

  async function lidarComEnvio(evento) {
    evento.preventDefault();
    setErro("");
    setEnviando(true);

    const resultado = ehCadastro
      ? await cadastrar(nome.trim(), email.trim(), senha)
      : await entrar(email.trim(), senha);

    setEnviando(false);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem);
    }
    // Se sucesso, o AuthContext atualiza o usuário automaticamente
    // e o componente pai (App) decide redirecionar para o dashboard.
  }

  return (
    <div className="tela-login">
      <div className="cartao-login">
        <div className="cabecalho-login">
          <div className="marca-login">
            <span className="marca-icone">$</span>
            <span>Finanças</span>
          </div>
          <h1>{ehCadastro ? "Crie sua conta" : "Entre na sua conta"}</h1>
          <p className="subtitulo-login">
            {ehCadastro
              ? "Organize receitas, despesas e lembretes em um só lugar."
              : "Acesse seu painel financeiro."}
          </p>
        </div>

        <form onSubmit={lidarComEnvio} className="formulario-login">
          {ehCadastro && (
            <div className="campo">
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={ehCadastro ? "Mínimo de 6 caracteres" : "Sua senha"}
              required
              minLength={6}
              autoComplete={ehCadastro ? "new-password" : "current-password"}
            />
          </div>

          {erro && <p className="mensagem-erro">{erro}</p>}

          <button type="submit" className="botao-primario" disabled={enviando}>
            {enviando ? "Aguarde..." : ehCadastro ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <p className="rodape-login">
          {ehCadastro ? "Já tem uma conta?" : "Ainda não tem conta?"}{" "}
          <button type="button" className="link-alternar" onClick={alternarModo}>
            {ehCadastro ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </div>
    </div>
  );
}
