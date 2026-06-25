import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useMoeda } from "../../context/MoedaContext";

const CORES = ["#1d9e75", "#d85a30", "#7f77dd", "#ba7517", "#e05c8a", "#5ba3c9", "#888780"];

export default function GraficoPizza({ despesas }) {
  const { formatarValor } = useMoeda();

  const agrupado = {};
  despesas.forEach((d) => {
    const cat = d.categoria || "Outros";
    agrupado[cat] = (agrupado[cat] || 0) + d.valor;
  });

  const dados = Object.entries(agrupado)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 7);

  if (dados.length === 0) {
    return (
      <div className="estado-vazio-grafico">
        <p>Nenhuma despesa registrada ainda.</p>
      </div>
    );
  }

  const total = dados.reduce((s, d) => s + d.valor, 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={dados}
            dataKey="valor"
            nameKey="nome"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={80}
            paddingAngle={2}
          >
            {dados.map((_, indice) => (
              <Cell key={indice} fill={CORES[indice % CORES.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(valor, nome) => [formatarValor(valor), nome]}
            contentStyle={{
              background: "var(--cor-fundo-cartao)",
              border: "1px solid var(--cor-borda-cartao)",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
        {dados.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--cor-texto-secundario)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: CORES[i % CORES.length], flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--cor-texto-principal)" }}>
              {d.nome}
            </span>
            <span style={{ flexShrink: 0, fontWeight: 600 }}>
              {total > 0 ? `${((d.valor / total) * 100).toFixed(0)}%` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
