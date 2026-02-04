import { Eye, FileText, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

const processosRecentes = [
  {
    id: "1",
    numeroProcesso: "64320/2025",
    servidor: "ABILIO SANTOS LESSA",
    matricula: "3067530",
    quinquenio: 7,
    status: "ATIVO",
    situacao: "DEFERIDO",
    dataAbertura: "15/01/2025",
  },
  {
    id: "2",
    numeroProcesso: "256639/2024",
    servidor: "ADILSON GOES SILVA",
    matricula: "3054890",
    quinquenio: 5,
    status: "FINALIZADO",
    situacao: "DEFERIDO",
    dataAbertura: "10/12/2024",
  },
  {
    id: "3",
    numeroProcesso: "189234/2024",
    servidor: "MARIA CONCEIÇÃO SOUZA",
    matricula: "3089765",
    quinquenio: 3,
    status: "PENDENTE",
    situacao: "EM_ANALISE",
    dataAbertura: "05/11/2024",
  },
  {
    id: "4",
    numeroProcesso: "178456/2024",
    servidor: "CARLOS ALBERTO FERREIRA",
    matricula: "3012456",
    quinquenio: 4,
    status: "ATIVO",
    situacao: "INDEFERIDO",
    dataAbertura: "20/10/2024",
  },
  {
    id: "5",
    numeroProcesso: "165789/2024",
    servidor: "ANA PAULA RIBEIRO",
    matricula: "3098765",
    quinquenio: 2,
    status: "FINALIZADO",
    situacao: "DEFERIDO",
    dataAbertura: "08/09/2024",
  },
];

const getSituacaoBadge = (situacao: string) => {
  const styles: Record<string, string> = {
    DEFERIDO: "status-deferido",
    INDEFERIDO: "status-indeferido",
    EM_ANALISE: "status-pendente",
    PENDENTE: "status-pendente",
  };

  const labels: Record<string, string> = {
    DEFERIDO: "Deferido",
    INDEFERIDO: "Indeferido",
    EM_ANALISE: "Em Análise",
    PENDENTE: "Pendente",
  };

  return (
    <Badge variant="outline" className={styles[situacao] || ""}>
      {labels[situacao] || situacao}
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
    <Badge variant="outline" className={styles[status] || ""}>
      {status}
    </Badge>
  );
};

export function ProcessosRecentes() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Processos Recentes</CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate('/processos')}>
          Ver todos
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Processo</TableHead>
              <TableHead>Servidor</TableHead>
              <TableHead>Quinquênio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Data Abertura</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processosRecentes.map((processo) => (
              <TableRow key={processo.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{processo.numeroProcesso}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{processo.servidor}</div>
                    <div className="text-xs text-muted-foreground">Mat: {processo.matricula}</div>
                  </div>
                </TableCell>
                <TableCell>{processo.quinquenio}º</TableCell>
                <TableCell>{getStatusBadge(processo.status)}</TableCell>
                <TableCell>{getSituacaoBadge(processo.situacao)}</TableCell>
                <TableCell>{processo.dataAbertura}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/servidores/${processo.matricula}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
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
  );
}
