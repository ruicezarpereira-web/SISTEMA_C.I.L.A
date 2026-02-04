import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const processosPorAno = [
  { ano: "2020", quantidade: 45 },
  { ano: "2021", quantidade: 62 },
  { ano: "2022", quantidade: 78 },
  { ano: "2023", quantidade: 95 },
  { ano: "2024", quantidade: 112 },
  { ano: "2025", quantidade: 42 },
];

const processosPorSituacao = [
  { name: "Deferido", value: 68, color: "hsl(160, 84%, 39%)" },
  { name: "Indeferido", value: 12, color: "hsl(0, 84%, 60%)" },
  { name: "Em Análise", value: 28, color: "hsl(38, 92%, 50%)" },
  { name: "Pendente", value: 10, color: "hsl(215, 16%, 47%)" },
];

const variacaoMensal = [
  { mes: "Jan", processos: 8 },
  { mes: "Fev", processos: 12 },
  { mes: "Mar", processos: 15 },
  { mes: "Abr", processos: 10 },
  { mes: "Mai", processos: 18 },
  { mes: "Jun", processos: 22 },
  { mes: "Jul", processos: 14 },
  { mes: "Ago", processos: 19 },
  { mes: "Set", processos: 25 },
  { mes: "Out", processos: 20 },
  { mes: "Nov", processos: 16 },
  { mes: "Dez", processos: 12 },
];

export function ProcessosPorAnoChart() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Processos por Ano</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={processosPorAno}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="ano" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="quantidade"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ProcessosPorSituacaoChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Processos por Situação</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={processosPorSituacao}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {processosPorSituacao.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function VariacaoMensalChart() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Variação Mensal de Processos (2025)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={variacaoMensal}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="mes" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Line
              type="monotone"
              dataKey="processos"
              stroke="hsl(var(--accent))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--accent))", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
