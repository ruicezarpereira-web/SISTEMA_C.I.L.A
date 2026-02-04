import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Mock data for a specific servidor
const servidorMock = {
  id: "1",
  nome: "ABILIO SANTOS LESSA",
  dataNascimento: new Date("1975-05-15"),
  sexo: "M" as const,
  idade: 49,
  matricula: "3067530",
  registroUnico: "1234567",
  rg: "12.345.678-9",
  cpf: "123.456.789-00",
  dataAdmissao: new Date("1999-10-01"),
  cargo: "AGENTE DE TRÂNSITO",
  lotacao: "GERÊNCIA DE OPERAÇÕES",
  vinculo: "ESTATUTÁRIO",
  email: "abilio.lessa@transalvador.gov.br",
  telefone: "(71) 99999-8888",
  endereco: "Rua das Palmeiras, 123 - Salvador/BA",
};

const quinqueniosMock = [
  {
    numero: 1,
    dataInicio: "01/10/1999",
    dataFim: "15/02/2005",
    diasCorridos: 1963,
    faltas: { quantidade: 5, diasDesconto: 50 },
    atestados: { quantidade: 88, diasDesconto: 88 },
    totalDescontos: 138,
    diasLiquidos: 1825,
    resultado: "DEFERIDO",
    diferenca: 0,
    processoNumero: "56781/2000",
  },
  {
    numero: 2,
    dataInicio: "16/02/2005",
    dataFim: "20/08/2010",
    diasCorridos: 1982,
    faltas: { quantidade: 8, diasDesconto: 80 },
    atestados: { quantidade: 77, diasDesconto: 77 },
    totalDescontos: 157,
    diasLiquidos: 1825,
    resultado: "DEFERIDO",
    diferenca: 0,
    processoNumero: "55221/2010",
  },
  {
    numero: 3,
    dataInicio: "21/08/2010",
    dataFim: "13/01/2016",
    diasCorridos: 1971,
    faltas: { quantidade: 6, diasDesconto: 60 },
    atestados: { quantidade: 86, diasDesconto: 86 },
    totalDescontos: 146,
    diasLiquidos: 1825,
    resultado: "DEFERIDO",
    diferenca: 0,
    processoNumero: "247829/2015",
  },
  {
    numero: 4,
    dataInicio: "14/01/2016",
    dataFim: "28/07/2021",
    diasCorridos: 1991,
    faltas: { quantidade: 7, diasDesconto: 70 },
    atestados: { quantidade: 96, diasDesconto: 96 },
    totalDescontos: 166,
    diasLiquidos: 1825,
    resultado: "DEFERIDO",
    diferenca: 0,
    processoNumero: "189234/2021",
  },
  {
    numero: 5,
    dataInicio: "29/07/2021",
    dataFim: "10/01/2027",
    diasCorridos: 2005,
    faltas: { quantidade: 10, diasDesconto: 100 },
    atestados: { quantidade: 80, diasDesconto: 80 },
    totalDescontos: 180,
    diasLiquidos: 1825,
    resultado: "DEFERIDO",
    diferenca: 0,
    processoNumero: "312456/2026",
  },
  {
    numero: 6,
    dataInicio: "11/01/2027",
    dataFim: "Atual",
    diasCorridos: 1152,
    faltas: { quantidade: 2, diasDesconto: 20 },
    atestados: { quantidade: 25, diasDesconto: 25 },
    totalDescontos: 45,
    diasLiquidos: 1107,
    resultado: "INDEFERIDO",
    diferenca: -718,
    processoNumero: null,
  },
  {
    numero: 7,
    dataInicio: "Pendente",
    dataFim: "Pendente",
    diasCorridos: 0,
    faltas: { quantidade: 0, diasDesconto: 0 },
    atestados: { quantidade: 0, diasDesconto: 0 },
    totalDescontos: 0,
    diasLiquidos: 0,
    resultado: "PENDENTE",
    diferenca: -1825,
    processoNumero: "64320/2025",
  },
];

const ocorrenciasMock = [
  { tipo: "FALTA", data: "15/03/2024", dias: 10, documento: "-", obs: "Falta não justificada" },
  { tipo: "ATESTADO", data: "10/04/2024", dias: 5, documento: "AT-2024-123", obs: "Licença médica" },
  { tipo: "ATESTADO", data: "20/05/2024", dias: 3, documento: "AT-2024-456", obs: "Consulta médica" },
  { tipo: "FÉRIAS", data: "01/07/2024", dias: 30, documento: "FER-2024-789", obs: "Férias regulamentares" },
  { tipo: "FALTA", data: "15/09/2024", dias: 10, documento: "-", obs: "Falta não justificada" },
  { tipo: "ATESTADO", data: "01/11/2024", dias: 7, documento: "AT-2024-890", obs: "Tratamento médico" },
];

export default function ServidorDetalhes() {
  const navigate = useNavigate();
  const { matricula } = useParams();
  
  const servidor = servidorMock; // In production, fetch by matricula
  const quinquenioAtual = quinqueniosMock[5]; // 6º quinquênio (em análise)
  const progresso = (quinquenioAtual.diasLiquidos / 1825) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{servidor.nome}</h1>
          <p className="text-muted-foreground">
            Matrícula: {servidor.matricula} | R. Único: {servidor.registroUnico}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Mapa de Cálculo
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Gerar Certidão
          </Button>
        </div>
      </div>

      {/* Servidor Info Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">CPF</span>
                <p className="font-medium">{servidor.cpf}</p>
              </div>
              <div>
                <span className="text-muted-foreground">RG</span>
                <p className="font-medium">{servidor.rg}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Nascimento</span>
                <p className="font-medium">
                  {servidor.dataNascimento.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Idade</span>
                <p className="font-medium">{servidor.idade} anos</p>
              </div>
              <div>
                <span className="text-muted-foreground">Sexo</span>
                <p className="font-medium">{servidor.sexo === "M" ? "Masculino" : "Feminino"}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{servidor.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{servidor.telefone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{servidor.endereco}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Funcionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Dados Funcionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Cargo</span>
                <p className="font-medium">{servidor.cargo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Lotação</span>
                <p className="font-medium">{servidor.lotacao}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Vínculo</span>
                <p className="font-medium">{servidor.vinculo}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data de Admissão</span>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {servidor.dataAdmissao.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Tempo de Serviço</span>
                <p className="font-medium">25 anos, 4 meses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quinquênio Atual */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {quinquenioAtual.numero}º Quinquênio (Atual)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progresso.toFixed(1)}%</span>
              </div>
              <Progress value={progresso} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Dias Corridos</span>
                <p className="font-bold text-lg">{quinquenioAtual.diasCorridos}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Dias Líquidos</span>
                <p className="font-bold text-lg text-primary">{quinquenioAtual.diasLiquidos}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Descontos</span>
                <p className="font-bold text-lg text-destructive">{quinquenioAtual.totalDescontos}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Dias Faltando</span>
                <p className="font-bold text-lg text-warning">{Math.abs(quinquenioAtual.diferenca)}</p>
              </div>
            </div>

            <Badge 
              variant="outline" 
              className={quinquenioAtual.resultado === "DEFERIDO" ? "status-deferido" : "status-pendente"}
            >
              {quinquenioAtual.resultado === "DEFERIDO" ? (
                <CheckCircle className="mr-1 h-3 w-3" />
              ) : (
                <AlertTriangle className="mr-1 h-3 w-3" />
              )}
              {quinquenioAtual.resultado}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Quinquênios and Ocorrências */}
      <Tabs defaultValue="quinquenios" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="quinquenios">Histórico de Quinquênios</TabsTrigger>
          <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quinquenios" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quinquênio</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Dias Corridos</TableHead>
                    <TableHead className="text-right">Descontos</TableHead>
                    <TableHead className="text-right">Dias Líquidos</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Processo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quinqueniosMock.map((q) => (
                    <TableRow key={q.numero}>
                      <TableCell className="font-medium">{q.numero}º</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {q.dataInicio} - {q.dataFim}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{q.diasCorridos || "-"}</TableCell>
                      <TableCell className="text-right">
                        {q.totalDescontos > 0 ? (
                          <span className="text-destructive">{q.totalDescontos}</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">{q.diasLiquidos || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            q.resultado === "DEFERIDO"
                              ? "status-deferido"
                              : q.resultado === "INDEFERIDO"
                              ? "status-indeferido"
                              : "status-pendente"
                          }
                        >
                          {q.resultado === "DEFERIDO" && <CheckCircle className="mr-1 h-3 w-3" />}
                          {q.resultado === "INDEFERIDO" && <XCircle className="mr-1 h-3 w-3" />}
                          {q.resultado === "PENDENTE" && <Clock className="mr-1 h-3 w-3" />}
                          {q.resultado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {q.processoNumero || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ocorrencias" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Dias</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Observação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ocorrenciasMock.map((o, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            o.tipo === "FALTA"
                              ? "status-indeferido"
                              : o.tipo === "ATESTADO"
                              ? "status-pendente"
                              : "status-ativo"
                          }
                        >
                          {o.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{o.data}</TableCell>
                      <TableCell className="text-right font-medium">
                        {o.tipo === "FALTA" ? (
                          <span className="text-destructive">{o.dias}</span>
                        ) : (
                          o.dias
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.documento}</TableCell>
                      <TableCell className="text-sm">{o.obs}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detalhe do Cálculo do Quinquênio Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento do {quinquenioAtual.numero}º Quinquênio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Período</span>
              </div>
              <p className="font-semibold">{quinquenioAtual.dataInicio} - {quinquenioAtual.dataFim}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Dias Corridos</span>
              </div>
              <p className="font-semibold text-2xl">{quinquenioAtual.diasCorridos}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-destructive/10">
              <div className="text-sm text-muted-foreground mb-2">Descontos</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>❌ Faltas ({quinquenioAtual.faltas.quantidade}x10)</span>
                  <span className="font-medium text-destructive">{quinquenioAtual.faltas.diasDesconto} dias</span>
                </div>
                <div className="flex justify-between">
                  <span>🏥 Atestados</span>
                  <span className="font-medium text-destructive">{quinquenioAtual.atestados.diasDesconto} dias</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-destructive">{quinquenioAtual.totalDescontos} dias</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-primary/10">
              <div className="text-sm text-muted-foreground mb-2">Resultado</div>
              <p className="font-bold text-3xl text-primary">{quinquenioAtual.diasLiquidos}</p>
              <p className="text-sm text-muted-foreground">dias líquidos</p>
              <p className="text-sm mt-2">
                {quinquenioAtual.diferenca >= 0 ? (
                  <span className="text-success font-medium">+{quinquenioAtual.diferenca} dias excedentes</span>
                ) : (
                  <span className="text-warning font-medium">{Math.abs(quinquenioAtual.diferenca)} dias faltando</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
