import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { useMoeda } from "../../context/MoedaContext";

function obterUltimos6Meses() {
  const meses = [];
  const agora = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    meses.push({
      mes: d.toLocaleDateString("pt-BR", { month: "short" }),
      ano: d.getFullYear(),
      mesNum: d.getMonth(),
      receitas: 0,
      despesas: 0,
    });
  }
  return meses;
}

export default function GraficoBarras({ transacoes }) {
  const { formatarValor, moeda } = useMoeda();

  const dados = obterUltimos6Meses();
  transacoes.forEach((t) => {
    const data = new Date(t.data);
    const entrada = dados.find(
      (d) => d.mesNum === data.getMonth() && d.ano === data.getFullYear()
    );
    if (!entrada) return;
    if (t.tipo === "receita") entrada.receitas += t.valor;
    else if (t.status === "pago") entrada.despesas += t.valor;
  });

  const sim = moeda.simbolo;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados} barCategoryGap="30%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 12, fill: "var(--cor-texto-secundario)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--cor-texto-secundario)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v === 0 ? `${sim}0` : `${sim}${(v / 1000).toFixed(1)}k`}
          tickCount={5}
          allowDecimals={false}
          width={54}
        />
        <Tooltip
          formatter={(valor) => formatarValor(valor)}
          contentStyle={{
            background: "var(--cor-fundo-cartao)",
            border: "1px solid var(--cor-borda-cartao)",
            borderRadius: 8,
            fontSize: 13,
          }}
          labelStyle={{ color: "var(--cor-texto-principal)", fontWeight: 600 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="receitas" name="Receitas" fill="#1d9e75" radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesas" name="Despesas" fill="#d85a30" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
