import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, FileText, Download, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const servidoresMock = [
  {
    id: "1",
    nome: "ABILIO SANTOS LESSA",
    matricula: "3067530",
    registroUnico: "1234567",
    cargo: "AGENTE DE TRÂNSITO",
    lotacao: "GERÊNCIA DE OPERAÇÕES",
    quinquenio: 7,
    status: "ATIVO",
    situacao: "DEFERIDO",
    diasRestantes: 0,
  },
  {
    id: "2",
    nome: "ADILSON GOES SILVA",
    matricula: "3054890",
    registroUnico: "2345678",
    cargo: "ANALISTA DE TRÂNSITO",
    lotacao: "GERÊNCIA ADMINISTRATIVA",
    quinquenio: 5,
    status: "FINALIZADO",
    situacao: "DEFERIDO",
    diasRestantes: 0,
  },
  {
    id: "3",
    nome: "MARIA CONCEIÇÃO SOUZA",
    matricula: "3089765",
    registroUnico: "3456789",
    cargo: "ASSISTENTE ADMINISTRATIVO",
    lotacao: "RECURSOS HUMANOS",
    quinquenio: 3,
    status: "PENDENTE",
    situacao: "EM_ANALISE",
    diasRestantes: 245,
  },
  {
    id: "4",
    nome: "CARLOS ALBERTO FERREIRA",
    matricula: "3012456",
    registroUnico: "4567890",
    cargo: "AGENTE DE TRÂNSITO",
    lotacao: "GERÊNCIA DE OPERAÇÕES",
    quinquenio: 4,
    status: "ATIVO",
    situacao: "INDEFERIDO",
    diasRestantes: -120,
  },
  {
    id: "5",
    nome: "ANA PAULA RIBEIRO",
    matricula: "3098765",
    registroUnico: "5678901",
    cargo: "COORDENADOR",
    lotacao: "GERÊNCIA DE PROJETOS",
    quinquenio: 2,
    status: "FINALIZADO",
    situacao: "DEFERIDO",
    diasRestantes: 0,
  },
  {
    id: "6",
    nome: "JOSÉ MARIA SANTOS",
    matricula: "3078901",
    registroUnico: "6789012",
    cargo: "TÉCNICO ADMINISTRATIVO",
    lotacao: "SETOR FINANCEIRO",
    quinquenio: 6,
    status: "ATIVO",
    situacao: "EM_ANALISE",
    diasRestantes: 12,
  },
  {
    id: "7",
    nome: "FRANCISCA LIMA COSTA",
    matricula: "3045678",
    registroUnico: "7890123",
    cargo: "AGENTE DE TRÂNSITO",
    lotacao: "GERÊNCIA DE OPERAÇÕES",
    quinquenio: 4,
    status: "ATIVO",
    situacao: "EM_ANALISE",
    diasRestantes: 45,
  },
  {
    id: "8",
    nome: "ANTÔNIO CARLOS OLIVEIRA",
    matricula: "3023456",
    registroUnico: "8901234",
    cargo: "SUPERVISOR",
    lotacao: "GERÊNCIA DE FISCALIZAÇÃO",
    quinquenio: 5,
    status: "PENDENTE",
    situacao: "EM_ANALISE",
    diasRestantes: 89,
  },
];

const getSituacaoBadge = (situacao: string) => {
  const styles: Record<string, string> = {
    DEFERIDO: "status-deferido",
    INDEFERIDO: "status-indeferido",
    EM_ANALISE: "status-pendente",
  };

  const labels: Record<string, string> = {
    DEFERIDO: "Deferido",
    INDEFERIDO: "Indeferido",
    EM_ANALISE: "Em Análise",
  };

  return (
    <Badge variant="outline" className={styles[situacao]}>
      {labels[situacao]}
    </Badge>
  );
};

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    ATIVO: "status-ativo",
    FINALIZADO: "status-deferido",
    PENDENTE: "status-pendente",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {status}
    </Badge>
  );
};

export default function Servidores() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [situacaoFilter, setSituacaoFilter] = useState("TODOS");
  const [quinquenioFilter, setQuinquenioFilter] = useState("TODOS");
  const [showFilters, setShowFilters] = useState(false);

  const filteredServidores = servidoresMock.filter((servidor) => {
    const matchesSearch =
      servidor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servidor.matricula.includes(searchTerm) ||
      servidor.registroUnico.includes(searchTerm);

    const matchesStatus = statusFilter === "TODOS" || servidor.status === statusFilter;
    const matchesSituacao = situacaoFilter === "TODOS" || servidor.situacao === situacaoFilter;
    const matchesQuinquenio = quinquenioFilter === "TODOS" || servidor.quinquenio.toString() === quinquenioFilter;

    return matchesSearch && matchesStatus && matchesSituacao && matchesQuinquenio;
  });

  const clearFilters = () => {
    setStatusFilter("TODOS");
    setSituacaoFilter("TODOS");
    setQuinquenioFilter("TODOS");
    setSearchTerm("");
  };

  const hasActiveFilters = statusFilter !== "TODOS" || situacaoFilter !== "TODOS" || quinquenioFilter !== "TODOS";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Servidores</h1>
          <p className="text-muted-foreground">
            Busque e gerencie os servidores cadastrados no sistema
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar Lista
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, matrícula ou registro único..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant={showFilters ? "secondary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {[statusFilter, situacaoFilter, quinquenioFilter].filter(f => f !== "TODOS").length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="flex flex-wrap gap-4 pt-4 border-t animate-fade-in">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Status do Processo
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="ATIVO">Ativo</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Situação
                  </label>
                  <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="DEFERIDO">Deferido</SelectItem>
                      <SelectItem value="INDEFERIDO">Indeferido</SelectItem>
                      <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Quinquênio
                  </label>
                  <Select value={quinquenioFilter} onValueChange={setQuinquenioFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      <SelectItem value="1">1º Quinquênio</SelectItem>
                      <SelectItem value="2">2º Quinquênio</SelectItem>
                      <SelectItem value="3">3º Quinquênio</SelectItem>
                      <SelectItem value="4">4º Quinquênio</SelectItem>
                      <SelectItem value="5">5º Quinquênio</SelectItem>
                      <SelectItem value="6">6º Quinquênio</SelectItem>
                      <SelectItem value="7">7º Quinquênio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />
                      Limpar filtros
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Resultados ({filteredServidores.length} servidores)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servidor</TableHead>
                <TableHead>Matrícula / R. Único</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Lotação</TableHead>
                <TableHead>Quinquênio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServidores.map((servidor) => (
                <TableRow
                  key={servidor.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/servidores/${servidor.matricula}`)}
                >
                  <TableCell className="font-medium">{servidor.nome}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{servidor.matricula}</div>
                      <div className="text-xs text-muted-foreground">{servidor.registroUnico}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{servidor.cargo}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">{servidor.lotacao}</TableCell>
                  <TableCell>{servidor.quinquenio}º</TableCell>
                  <TableCell>{getStatusBadge(servidor.status)}</TableCell>
                  <TableCell>{getSituacaoBadge(servidor.situacao)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        servidor.diasRestantes > 0
                          ? "text-warning font-medium"
                          : servidor.diasRestantes < 0
                          ? "text-destructive font-medium"
                          : "text-success font-medium"
                      }
                    >
                      {servidor.diasRestantes > 0
                        ? `${servidor.diasRestantes} restantes`
                        : servidor.diasRestantes < 0
                        ? `${Math.abs(servidor.diasRestantes)} excedentes`
                        : "Completo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/servidores/${servidor.matricula}`);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <FileText className="mr-2 h-4 w-4" />
                          Gerar Certidão
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
