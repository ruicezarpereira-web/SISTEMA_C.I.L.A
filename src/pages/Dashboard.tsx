 import { AlertTriangle, Calendar, Clock, FileText, TrendingUp, Users, CheckCircle } from "lucide-react";
 import { KPICard } from "@/components/dashboard/KPICard";
 import { ProcessosPorAnoChart, ProcessosPorSituacaoChart } from "@/components/dashboard/ProcessosChart";
 import { ProcessosRecentes } from "@/components/dashboard/ProcessosRecentes";
 import { ServidoresProximos } from "@/components/dashboard/ServidoresProximos";
 import { useDashboardKPIs } from "@/hooks/useDashboard";
 
 export default function Dashboard() {
   const { data: kpis, isLoading } = useDashboardKPIs();
 
   return (
     <div className="space-y-6 animate-fade-in">
       <div>
         <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
         <p className="text-muted-foreground">
           Visão geral do Sistema de Gestão de Licenças Prêmio
         </p>
       </div>
 
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <KPICard
           title="Vencidos"
           value={isLoading ? "..." : kpis?.vencidos ?? 0}
           subtitle="Processos"
           icon={AlertTriangle}
           variant="danger"
         />
         <KPICard
           title="Urgentes"
           value={isLoading ? "..." : kpis?.urgentes ?? 0}
           subtitle="< 30 dias"
           icon={Clock}
           variant="warning"
         />
         <KPICard
           title="Próximos"
           value={isLoading ? "..." : kpis?.proximos ?? 0}
           subtitle="30-90 dias"
           icon={Calendar}
           variant="info"
         />
         <KPICard
           title="Em Breve"
           value={isLoading ? "..." : kpis?.emBreve ?? 0}
           subtitle="90-180 dias"
           icon={TrendingUp}
           variant="default"
         />
       </div>
 
       <div className="grid gap-4 md:grid-cols-3">
         <KPICard
           title="Total de Processos"
           value={isLoading ? "..." : kpis?.totalProcessos ?? 0}
           icon={FileText}
           variant="default"
         />
         <KPICard
           title="Tempo Médio Publicação"
           value={isLoading ? "..." : `${kpis?.tempoMedioPublicacao ?? 0} dias`}
           icon={CheckCircle}
           variant="success"
         />
         <KPICard
           title="Servidores Cadastrados"
           value={isLoading ? "..." : kpis?.totalServidores ?? 0}
           icon={Users}
           variant="info"
         />
       </div>
 
       <div className="grid gap-6 lg:grid-cols-2">
         <ProcessosPorAnoChart />
         <ProcessosPorSituacaoChart />
       </div>
 
       <div className="grid gap-6 lg:grid-cols-3">
         <div className="lg:col-span-2">
           <ProcessosRecentes />
         </div>
         <ServidoresProximos />
       </div>
     </div>
   );
 }
