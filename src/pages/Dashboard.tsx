import {
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  ProcessosPorAnoChart,
  ProcessosPorSituacaoChart,
  VariacaoMensalChart,
} from "@/components/dashboard/ProcessosChart";
import { ProcessosRecentes } from "@/components/dashboard/ProcessosRecentes";
import { ServidoresProximos } from "@/components/dashboard/ServidoresProximos";

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do Sistema de Gestão de Licenças Prêmio
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Vencidos"
          value={42}
          subtitle="Processos"
          icon={AlertTriangle}
          variant="danger"
        />
        <KPICard
          title="Urgentes"
          value={28}
          subtitle="< 30 dias"
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="Próximos"
          value={15}
          subtitle="30-60 dias"
          icon={Calendar}
          variant="info"
        />
        <KPICard
          title="Em Breve"
          value={33}
          subtitle="60-90 dias"
          icon={TrendingUp}
          variant="default"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Total de Processos"
          value={118}
          icon={FileText}
          variant="default"
        />
        <KPICard
          title="Tempo Médio Publicação"
          value="127 dias"
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Servidores Cadastrados"
          value="1.247"
          icon={Users}
          variant="info"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ProcessosPorAnoChart />
        <ProcessosPorSituacaoChart />
      </div>

      {/* Line Chart */}
      <VariacaoMensalChart />

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProcessosRecentes />
        </div>
        <ServidoresProximos />
      </div>
    </div>
  );
}
