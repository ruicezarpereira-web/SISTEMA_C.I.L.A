 import { useState, useRef } from "react";
 import { Upload, FileSpreadsheet, Users, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 import { Progress } from "@/components/ui/progress";
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { parseServidoresExcel, parseFaltasExcel, parseAfastamentosExcel } from "@/lib/excel-import";
 
 type ImportType = 'servidores' | 'faltas' | 'afastamentos';
 
 interface ImportResult {
   success: number;
   errors: string[];
 }
 
 export default function ImportarDados() {
   const { toast } = useToast();
   const [activeTab, setActiveTab] = useState<ImportType>('servidores');
   const [isImporting, setIsImporting] = useState(false);
   const [progress, setProgress] = useState(0);
   const [result, setResult] = useState<ImportResult | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file) return;
 
     setIsImporting(true);
     setProgress(10);
     setResult(null);
 
     try {
      let data: any[] = [];
      const errosValidacao: string[] = [];

      if (activeTab === 'servidores') {
        const parsed = await parseServidoresExcel(file);
        data = parsed.servidores;
        errosValidacao.push(...parsed.erros);
      } else if (activeTab === 'faltas') {
         data = await parseFaltasExcel(file);
       } else if (activeTab === 'afastamentos') {
         data = await parseAfastamentosExcel(file);
       }
 
       setProgress(50);
 
       if (data.length === 0) {
         throw new Error('Nenhum dado válido encontrado na planilha');
       }
 
       // Insert data in batches
       const batchSize = 100;
       let successCount = 0;
       const errors: string[] = [];
 
       for (let i = 0; i < data.length; i += batchSize) {
         const batch = data.slice(i, i + batchSize);
         const { error } = await supabase
           .from(activeTab)
           .upsert(batch, { 
             onConflict: activeTab === 'servidores' ? 'matricula' : undefined 
           });
 
         if (error) {
           errors.push(`Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
         } else {
           successCount += batch.length;
         }
 
         setProgress(50 + (i / data.length) * 50);
       }
 
       setProgress(100);
       setResult({ success: successCount, errors });
 
       // Log activity
       await supabase.from('logs_atividade').insert({
         tipo_acao: 'UPLOAD',
         detalhes: `Importação de ${activeTab}: ${successCount} registros importados`,
       });
 
       toast({
         title: "Importação concluída!",
         description: `${successCount} registros importados com sucesso.`,
       });
     } catch (error: any) {
       toast({
         title: "Erro na importação",
         description: error.message,
         variant: "destructive",
       });
       setResult({ success: 0, errors: [error.message] });
     } finally {
       setIsImporting(false);
       if (fileInputRef.current) {
         fileInputRef.current.value = '';
       }
     }
   };
 
   const importConfigs = {
     servidores: {
       icon: Users,
       title: "Servidores",
       description: "Importe dados cadastrais dos servidores",
       columns: ["Nome", "Matrícula", "CPF", "Data Nascimento", "Data Admissão", "Cargo", "Lotação"],
     },
     faltas: {
       icon: Calendar,
       title: "Faltas",
       description: "Importe registros de faltas dos servidores",
       columns: ["Matrícula", "Evento", "Tipo Evento", "Competência", "Valor"],
     },
     afastamentos: {
       icon: FileSpreadsheet,
       title: "Afastamentos",
       description: "Importe registros de afastamentos e licenças",
       columns: ["Matrícula", "Motivo", "Data Início", "Data Fim", "Cargo"],
     },
   };
 
   return (
     <div className="space-y-6 animate-fade-in">
       <div>
         <h1 className="text-3xl font-bold tracking-tight">Importar Dados</h1>
         <p className="text-muted-foreground">
           Importe dados de servidores, faltas e afastamentos via planilha Excel
         </p>
       </div>
 
       <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ImportType)}>
         <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="servidores">
             <Users className="h-4 w-4 mr-2" />
             Servidores
           </TabsTrigger>
           <TabsTrigger value="faltas">
             <Calendar className="h-4 w-4 mr-2" />
             Faltas
           </TabsTrigger>
           <TabsTrigger value="afastamentos">
             <FileSpreadsheet className="h-4 w-4 mr-2" />
             Afastamentos
           </TabsTrigger>
         </TabsList>
 
         {(['servidores', 'faltas', 'afastamentos'] as const).map((type) => (
           <TabsContent key={type} value={type}>
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   {(() => {
                     const Icon = importConfigs[type].icon;
                     return <Icon className="h-5 w-5" />;
                   })()}
                   {importConfigs[type].title}
                 </CardTitle>
                 <CardDescription>{importConfigs[type].description}</CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                 <Alert>
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Formato esperado</AlertTitle>
                   <AlertDescription>
                     A planilha deve conter as seguintes colunas:
                     <span className="font-medium block mt-1">
                       {importConfigs[type].columns.join(", ")}
                     </span>
                   </AlertDescription>
                 </Alert>
 
                 <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept=".xlsx,.xls,.xlsm"
                     onChange={handleFileSelect}
                     className="hidden"
                     id="file-upload"
                   />
                   <label htmlFor="file-upload" className="cursor-pointer">
                     <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                     <p className="text-lg font-medium">
                       Clique para selecionar arquivo
                     </p>
                     <p className="text-sm text-muted-foreground mt-1">
                       Formatos aceitos: .xlsx, .xls, .xlsm
                     </p>
                   </label>
                 </div>
 
                 {isImporting && (
                   <div className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                       <span>Importando dados...</span>
                       <span>{Math.round(progress)}%</span>
                     </div>
                     <Progress value={progress} />
                   </div>
                 )}
 
                 {result && (
                   <Alert variant={result.errors.length > 0 ? "destructive" : "default"}>
                     {result.errors.length > 0 ? (
                       <AlertCircle className="h-4 w-4" />
                     ) : (
                       <CheckCircle2 className="h-4 w-4" />
                     )}
                     <AlertTitle>
                       {result.errors.length > 0 ? "Importação com erros" : "Sucesso!"}
                     </AlertTitle>
                     <AlertDescription>
                       {result.success} registros importados com sucesso.
                       {result.errors.length > 0 && (
                         <ul className="mt-2 list-disc list-inside">
                           {result.errors.slice(0, 5).map((err, i) => (
                             <li key={i} className="text-sm">{err}</li>
                           ))}
                         </ul>
                       )}
                     </AlertDescription>
                   </Alert>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
         ))}
       </Tabs>
     </div>
   );
 }