import { TrendingUp, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const servidoresProximos = [
  {
    nome: "JOSÉ MARIA SANTOS",
    matricula: "3078901",
    diasFaltando: 12,
    progresso: 99.3,
  },
  {
    nome: "FRANCISCA LIMA COSTA",
    matricula: "3045678",
    diasFaltando: 45,
    progresso: 97.5,
  },
  {
    nome: "ANTÔNIO CARLOS OLIVEIRA",
    matricula: "3023456",
    diasFaltando: 89,
    progresso: 95.1,
  },
  {
    nome: "MARIA JOSÉ PEREIRA",
    matricula: "3056789",
    diasFaltando: 134,
    progresso: 92.7,
  },
  {
    nome: "PEDRO HENRIQUE SILVA",
    matricula: "3034567",
    diasFaltando: 178,
    progresso: 90.3,
  },
  {
    nome: "CLAUDIA REGINA SOUZA",
    matricula: "3067890",
    diasFaltando: 210,
    progresso: 88.5,
  },
  {
    nome: "ROBERTO CARLOS ALVES",
    matricula: "3012345",
    diasFaltando: 256,
    progresso: 86.0,
  },
  {
    nome: "LUCIANA MARIA FERREIRA",
    matricula: "3089012",
    diasFaltando: 312,
    progresso: 82.9,
  },
];

export function ServidoresProximos() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <TrendingUp className="h-5 w-5 text-success" />
        <CardTitle className="text-lg font-semibold">Próximos ao Deferimento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {servidoresProximos.map((servidor, index) => (
            <div key={servidor.matricula} className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="truncate">
                    <span className="font-medium text-sm">{servidor.nome}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      Mat: {servidor.matricula}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {servidor.diasFaltando} dias
                  </span>
                </div>
                <Progress value={servidor.progresso} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
