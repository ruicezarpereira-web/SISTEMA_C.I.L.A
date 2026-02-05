 import { Eye, FileText, MoreHorizontal, FolderOpen } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
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
 import { useProcessos } from "@/hooks/useProcessos";
 import { format } from "date-fns";
 
 const getSituacaoBadge = (situacao: string) => {
   const styles: Record<string, string> = {
     DEFERIDO: "status-deferido",
     INDEFERIDO: "status-indeferido",
     EM_ANALISE: "status-pendente",
     DEFERIDO_PUBLICADO: "status-deferido",
   };
   const labels: Record<string, string> = {
     DEFERIDO: "Deferido",
     INDEFERIDO: "Indeferido",
     EM_ANALISE: "Em Análise",
     DEFERIDO_PUBLICADO: "Publicado",
   };
   return <Badge variant="outline" className={styles[situacao] || ""}>{labels[situacao] || situacao}</Badge>;
 };
 
 const getStatusBadge = (status: string) => {
   const styles: Record<string, string> = { ATIVO: "status-ativo", FINALIZADO: "status-deferido", PENDENTE: "status-pendente" };
   return <Badge variant="outline" className={styles[status] || ""}>{status}</Badge>;
 };
 
 export function ProcessosRecentes() {
   const navigate = useNavigate();
   const { data: processos, isLoading } = useProcessos();
   const recentProcessos = processos?.slice(0, 5) || [];
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center justify-between">
         <CardTitle className="text-lg font-semibold">Processos Recentes</CardTitle>
         <Button variant="outline" size="sm" onClick={() => navigate('/processos')}>Ver todos</Button>
       </CardHeader>
       <CardContent>
         <Table>
           <TableHeader>
             <TableRow>
               <TableHead>Nº Processo</TableHead>
               <TableHead>Servidor</TableHead>
               <TableHead>Quinquênio</TableHead>
               <TableHead>Situação</TableHead>
               <TableHead>Data</TableHead>
               <TableHead className="text-right">Ações</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {isLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
               ))
             ) : recentProcessos.length === 0 ? (
               <TableRow><TableCell colSpan={6} className="text-center py-10"><FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-muted-foreground">Nenhum processo</p></TableCell></TableRow>
             ) : (
               recentProcessos.map((p) => (
                 <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                   <TableCell className="font-medium">{p.numero_processo}</TableCell>
                   <TableCell><div className="font-medium">{p.servidores?.nome || "-"}</div><div className="text-xs text-muted-foreground">Mat: {p.servidores?.matricula || "-"}</div></TableCell>
                   <TableCell>{p.quinquenio}º</TableCell>
                   <TableCell>{getSituacaoBadge(p.situacao)}</TableCell>
                   <TableCell>{format(new Date(p.data_abertura), "dd/MM/yyyy")}</TableCell>
                   <TableCell className="text-right">
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => navigate(`/servidores/${p.servidores?.matricula}`)}><Eye className="mr-2 h-4 w-4" />Ver Detalhes</DropdownMenuItem>
                         <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />Gerar Certidão</DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </TableCell>
                 </TableRow>
               ))
             )}
           </TableBody>
         </Table>
       </CardContent>
     </Card>
   );
 }