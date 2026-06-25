// transacoes.js
// CRUD de receitas/despesas no Firestore, isolado por usuário (uid).
// Reaproveita a mesma lógica de domínio do script Python original:
// tipo, data, valor, status (pago/pendente) e o cálculo de saldo
// real vs previsto, incluindo a classificação atrasada/pendente futura.

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// Caminho da coleção de transações de um usuário específico.
function colecaoTransacoes(uid) {
  return collection(db, "usuarios", uid, "transacoes");
}

// Adiciona uma nova transação (receita ou despesa).
// tipo: "receita" | "despesa"
// dadosTransacao: { categoria, data (Date), valor (number), status: "pago" | "pendente" }
export async function adicionarTransacao(uid, tipo, dadosTransacao) {
  const { categoria, data, valor, status, ...extras } = dadosTransacao;

  return addDoc(colecaoTransacoes(uid), {
    tipo,
    categoria,
    data: Timestamp.fromDate(new Date(data)),
    valor: Number(valor),
    status,
    ...extras,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

// Edita uma transação existente.
export async function editarTransacao(uid, transacaoId, novosDados) {
  const ref = doc(db, "usuarios", uid, "transacoes", transacaoId);

  const payload = { ...novosDados, atualizadoEm: serverTimestamp() };
  if (novosDados.data) {
    payload.data = Timestamp.fromDate(new Date(novosDados.data));
  }

  return updateDoc(ref, payload);
}

// Remove uma transação.
export async function removerTransacao(uid, transacaoId) {
  const ref = doc(db, "usuarios", uid, "transacoes", transacaoId);
  return deleteDoc(ref);
}

// Escuta em tempo real todas as transações do usuário, ordenadas por data.
// Uso: const unsubscribe = escutarTransacoes(uid, (transacoes) => { ... });
export function escutarTransacoes(uid, callback) {
  const q = query(colecaoTransacoes(uid), orderBy("data", "desc"));

  return onSnapshot(q, (snapshot) => {
    const transacoes = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      data: docSnap.data().data.toDate(), // converte Timestamp -> Date
    }));
    callback(transacoes);
  });
}

// Escuta apenas transações de um tipo específico ("receita" ou "despesa").
export function escutarTransacoesPorTipo(uid, tipo, callback) {
  const q = query(
    colecaoTransacoes(uid),
    where("tipo", "==", tipo),
    orderBy("data", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const transacoes = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      data: docSnap.data().data.toDate(),
    }));
    callback(transacoes);
  });
}

// --- Lógica de relatório (equivalente à função ver_relatorio() do script) ---
//
// Recebe a lista de transações (já carregada via escutarTransacoes) e
// devolve os totais e o status de cada despesa pendente (atrasada ou
// pendente futura), exatamente como o script Python fazia.
export function calcularRelatorio(transacoes) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let totalReceitas = 0;
  let totalDespesasPagas = 0;
  let totalPendenteFuturo = 0;

  const despesasComStatus = [];
  const receitas = [];

  for (const t of transacoes) {
    if (t.tipo === "receita") {
      receitas.push(t);
      totalReceitas += t.valor;
      continue;
    }

    // despesa
    let statusExibicao;
    if (t.status === "pago") {
      statusExibicao = "PAGA";
      totalDespesasPagas += t.valor;
    } else {
      const dataTransacao = new Date(t.data);
      dataTransacao.setHours(0, 0, 0, 0);
      statusExibicao = dataTransacao < hoje ? "ATRASADA" : "PENDENTE_FUTURA";
      totalPendenteFuturo += t.valor;
    }

    despesasComStatus.push({ ...t, statusExibicao });
  }

  const saldoReal = totalReceitas - totalDespesasPagas;
  const saldoPrevisto = saldoReal - totalPendenteFuturo;

  return {
    receitas,
    despesas: despesasComStatus,
    totalReceitas,
    totalDespesasPagas,
    totalPendenteFuturo,
    saldoReal,
    saldoPrevisto,
    noAzul: saldoReal >= 0,
  };
}

// --- Filtros (equivalentes a filtrar_por_status() e filtrar_por_nome()) ---

export function filtrarPorStatus(transacoes, status) {
  return transacoes.filter((t) => t.status === status);
}

export function filtrarPorNome(transacoes, termoBusca) {
  const termo = termoBusca.trim().toLowerCase();
  return transacoes.filter((t) => t.categoria.toLowerCase().includes(termo));
}
