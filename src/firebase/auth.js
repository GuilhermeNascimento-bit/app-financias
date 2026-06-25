// auth.js
// Funções de autenticação: cadastro, login, logout e observador de sessão.
// Espelha o conceito do script Python de ter "um usuário", mas agora
// cada usuário autenticado tem seu próprio espaço de dados no Firestore.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// Cadastra um novo usuário com e-mail/senha e cria o documento dele
// em "usuarios/{uid}" para guardar dados de perfil.
export async function cadastrarUsuario(nome, email, senha) {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  const usuario = credencial.user;

  await updateProfile(usuario, { displayName: nome });

  await setDoc(doc(db, "usuarios", usuario.uid), {
    nome,
    email,
    criadoEm: serverTimestamp(),
  });

  return usuario;
}

// Faz login de um usuário já cadastrado.
export async function logarUsuario(email, senha) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  return credencial.user;
}

// Faz logout do usuário atual.
export async function deslogarUsuario() {
  await signOut(auth);
}

// Observa mudanças no estado de login (usado para proteger rotas
// e saber quem é o usuário atual em qualquer componente).
// Uso: const unsubscribe = observarUsuario((usuario) => { ... });
export function observarUsuario(callback) {
  return onAuthStateChanged(auth, callback);
}
