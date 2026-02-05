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
 } from "recharts";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Skeleton } from "@/components/ui/skeleton";
 import { useProcessosPorAno, useProcessosPorSituacao } from "@/hooks/useDashboard";
 
 const situacaoColors: Record<string, string> = {
   DEFERIDO: "hsl(160, 84%, 39%)",
   INDEFERIDO: "hsl(0, 84%, 60%)",
   EM_ANALISE: "hsl(38, 92%, 50%)",
   DEFERIDO_PUBLICADO: "hsl(215, 70%, 50%)",
 };
 
 const situacaoLabels: Record<string, string> = {
   DEFERIDO: "Deferido",
   INDEFERIDO: "Indeferido",
   EM_ANALISE: "Em Análise",
   DEFERIDO_PUBLICADO: "Publicado",
 };
 
 export function ProcessosPorAnoChart() {
   const { data, isLoading } = useProcessosPorAno();
 
   const chartData = data?.map(d => ({
     ano: d.ano.toString(),
     quantidade: d.quantidade,
   })) || [];
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="text-lg font-semibold">Processos por Ano</CardTitle>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <Skeleton className="h-[300px] w-full" />
         ) : (
           <ResponsiveContainer width="100%" height={300}>
             <BarChart data={chartData}>
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
         )}
       </CardContent>
     </Card>
   );
 }
 
 export function ProcessosPorSituacaoChart() {
   const { data, isLoading } = useProcessosPorSituacao();
 
   const chartData = data?.map(d => ({
     name: situacaoLabels[d.situacao] || d.situacao,
     value: d.quantidade,
     color: situacaoColors[d.situacao] || "hsl(215, 16%, 47%)",
   })) || [];
 
   return (
     <Card>
       <CardHeader>
         <CardTitle className="text-lg font-semibold">Processos por Situação</CardTitle>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <Skeleton className="h-[300px] w-full" />
         ) : (
           <ResponsiveContainer width="100%" height={300}>
             <PieChart>
               <Pie
                 data={chartData}
                 cx="50%"
                 cy="50%"
                 innerRadius={60}
                 outerRadius={100}
                 paddingAngle={2}
                 dataKey="value"
               >
                 {chartData.map((entry, index) => (
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
         )}
       </CardContent>
     </Card>
   );
 }
