// AuthContext.jsx
// Contexto global de autenticação. Envolve toda a aplicação e expõe
// o usuário atual, um estado de "carregando" (enquanto verifica a
// sessão) e as funções de cadastro/login/logout já tratadas.

import { createContext, useContext, useEffect, useState } from "react";
import {
  cadastrarUsuario as cadastrarUsuarioFirebase,
  logarUsuario as logarUsuarioFirebase,
  deslogarUsuario as deslogarUsuarioFirebase,
  observarUsuario,
} from "../firebase/auth";

const AuthContext = createContext(null);

// Traduz os códigos de erro do Firebase para mensagens em português,
// compreensíveis para quem está usando o app.
function traduzirErroFirebase(codigo) {
  const mensagens = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado. Tente fazer login.",
    "auth/invalid-email": "O e-mail informado não é válido.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/user-not-found": "Não encontramos uma conta com este e-mail.",
    "auth/wrong-password": "Senha incorreta. Tente novamente.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um momento e tente de novo.",
    "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
  };
  return mensagens[codigo] || "Ocorreu um erro inesperado. Tente novamente.";
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = observarUsuario((usuarioFirebase) => {
      setUsuario(usuarioFirebase);
      setCarregando(false);
    });
    return unsubscribe;
  }, []);

  async function cadastrar(nome, email, senha) {
    try {
      await cadastrarUsuarioFirebase(nome, email, senha);
      return { sucesso: true };
    } catch (erro) {
      return { sucesso: false, mensagem: traduzirErroFirebase(erro.code) };
    }
  }

  async function entrar(email, senha) {
    try {
      await logarUsuarioFirebase(email, senha);
      return { sucesso: true };
    } catch (erro) {
      return { sucesso: false, mensagem: traduzirErroFirebase(erro.code) };
    }
  }

  async function sair() {
    await deslogarUsuarioFirebase();
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, cadastrar, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook de acesso ao contexto. Uso: const { usuario, entrar } = useAuth();
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
  }
  return contexto;
}
