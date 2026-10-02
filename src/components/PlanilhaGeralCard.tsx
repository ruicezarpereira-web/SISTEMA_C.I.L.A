import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { importarPlanilhaGeral, type ImportSummary } from "@/lib/import-runner";

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (!itens.length) return null;
  return (
    <details className="rounded-md border p-3">
      <summary className="cursor-pointer font-medium">{titulo} ({itens.length})</summary>
      <ul className="mt-2 max-h-64 overflow-auto list-disc list-inside text-sm space-y-1">
        {itens.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </details>
  );
}

export default function PlanilhaGeralCard() {
  const { toast } = useToast();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [rodando, setRodando] = useState(false);
  const [pct, setPct] = useState(0);
  const [etapa, setEtapa] = useState("");
  const [resumo, setResumo] = useState<ImportSummary | null>(null);

  const executar = async (dryRun: boolean) => {
    if (!arquivo) return;
    setRodando(true);
    setResumo(null);
    try {
      const r = await importarPlanilhaGeral(arquivo, {
        dryRun,
        onProgress: (p, e) => { setPct(p); setEtapa(e); },
      });
      setResumo(r);
      toast({ title: dryRun ? "Simulação concluída" : "Importação concluída" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setRodando(false);
    }
  };

  const linhas: [string, number][] = resumo ? [
    ["Servidores", resumo.servidores],
    ["Quinquênios", resumo.quinquenios],
    ["  dos quais deferidos", resumo.quinqueniosDeferidos],
    ["Períodos de gozo", resumo.gozos],
    ["Processos", resumo.processos],
    ["Afastamentos (ocorrências)", resumo.afastamentos],
    ["Faltas com dias (ocorrências)", resumo.faltas],
    ["Faltas sem dias (revisão)", resumo.faltasLegadoSemDias],
    ["Estornos (revisão)", resumo.estornos],
    ["Erros", resumo.erros.length],
  ] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" /> Planilha Geral de Licenças
        </CardTitle>
        <CardDescription>
          Lê as abas de servidores, processos, afastamentos e faltas. Faça primeiro a simulação, que não grava nada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input type="file" accept=".xlsx,.xlsm,.xls" onChange={(e) => { setArquivo(e.target.files?.[0] ?? null); setResumo(null); }} />
        <div className="flex gap-2">
          <Button variant="outline" disabled={!arquivo || rodando} onClick={() => executar(true)}>Simular (sem gravar)</Button>
          <Button disabled={!arquivo || rodando || !resumo?.dryRun} onClick={() => executar(false)}>Confirmar importação</Button>
        </div>
        {rodando && (<div className="space-y-1"><p className="text-sm">{etapa}</p><Progress value={pct} /></div>)}
        {resumo && (
          <div className="space-y-3">
            <p className="font-medium">{resumo.dryRun ? "Resultado da simulação" : "Resultado da importação"}</p>
            <table className="text-sm">
              <tbody>{linhas.map(([k, v]) => (<tr key={k}><td className="pr-6 whitespace-pre">{k}</td><td className="font-medium">{v}</td></tr>))}</tbody>
            </table>
            <Lista titulo="Motivos de afastamento não mapeados" itens={resumo.motivosNaoMapeados.map((m) => `${m.motivo}: ${m.ocorrencias}`)} />
            <Lista titulo="Erros e inconsistências" itens={resumo.erros} />
            <Lista titulo="Faltas sem quantidade de dias" itens={resumo.revisaoFaltasSemDias} />
            <Lista titulo="Estornos para revisar" itens={resumo.revisaoEstornos} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
