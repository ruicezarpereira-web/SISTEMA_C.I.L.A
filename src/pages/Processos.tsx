 import { useState } from "react";
 import { Link } from "react-router-dom";
 import { Plus, Search, Filter, FileText, Calendar, User } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
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
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { useProcessos } from "@/hooks/useProcessos";
 import { useAuth } from "@/contexts/AuthContext";
 import { format } from "date-fns";
 import { Skeleton } from "@/components/ui/skeleton";
 
 const situacaoColors: Record<string, string> = {
   DEFERIDO: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
   INDEFERIDO: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
   EM_ANALISE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
   DEFERIDO_PUBLICADO: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
 };
 
 const situacaoLabels: Record<string, string> = {
   DEFERIDO: "Deferido",
   INDEFERIDO: "Indeferido",
   EM_ANALISE: "Em Análise",
   DEFERIDO_PUBLICADO: "Deferido/Publicado",
 };
 
 export default function Processos() {
   const [search, setSearch] = useState("");
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const { isAdmin } = useAuth();
   
   const { data: processos, isLoading } = useProcessos(
     statusFilter !== "all" ? statusFilter : undefined
   );
 
   const filteredProcessos = processos?.filter(p => {
     if (!search) return true;
     const searchLower = search.toLowerCase();
     return (
       p.numero_processo.toLowerCase().includes(searchLower) ||
       p.servidores?.nome.toLowerCase().includes(searchLower) ||
       p.servidores?.matricula.toLowerCase().includes(searchLower)
     );
   });
 
   return (
     <div className="space-y-6 animate-fade-in">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
           <p className="text-muted-foreground">
             Gerencie os processos de licença prêmio
           </p>
         </div>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Filter className="h-5 w-5" />
             Filtros
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex flex-col md:flex-row gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="Buscar por número, servidor ou matrícula..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="pl-10"
               />
             </div>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
               <SelectTrigger className="w-[200px]">
                 <SelectValue placeholder="Status" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Todos os Status</SelectItem>
                 <SelectItem value="ATIVO">Ativos</SelectItem>
                 <SelectItem value="PENDENTE">Pendentes</SelectItem>
                 <SelectItem value="FINALIZADO">Finalizados</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </CardContent>
       </Card>
 
       <Card>
         <CardContent className="p-0">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Nº Processo</TableHead>
                 <TableHead>Servidor</TableHead>
                 <TableHead>Quinquênio</TableHead>
                 <TableHead>Data Abertura</TableHead>
                 <TableHead>Situação</TableHead>
                 <TableHead>Status</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {isLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                   <TableRow key={i}>
                     {Array.from({ length: 6 }).map((_, j) => (
                       <TableCell key={j}>
                         <Skeleton className="h-4 w-full" />
                       </TableCell>
                     ))}
                   </TableRow>
                 ))
               ) : filteredProcessos?.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-10">
                     <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                     <p className="text-muted-foreground">Nenhum processo encontrado</p>
                   </TableCell>
                 </TableRow>
               ) : (
                 filteredProcessos?.map((processo) => (
                   <TableRow key={processo.id}>
                     <TableCell className="font-medium">
                       {processo.numero_processo}
                     </TableCell>
                     <TableCell>
                       <Link 
                         to={`/servidores/${processo.servidores?.matricula}`}
                         className="hover:text-primary hover:underline"
                       >
                         <div className="flex items-center gap-2">
                           <User className="h-4 w-4 text-muted-foreground" />
                           <div>
                             <div>{processo.servidores?.nome}</div>
                             <div className="text-xs text-muted-foreground">
                               {processo.servidores?.matricula}
                             </div>
                           </div>
                         </div>
                       </Link>
                     </TableCell>
                     <TableCell>{processo.quinquenio}º</TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <Calendar className="h-4 w-4 text-muted-foreground" />
                         {format(new Date(processo.data_abertura), "dd/MM/yyyy")}
                       </div>
                     </TableCell>
                     <TableCell>
                       <Badge className={situacaoColors[processo.situacao]}>
                         {situacaoLabels[processo.situacao]}
                       </Badge>
                     </TableCell>
                     <TableCell>
                       <Badge variant={processo.status === 'ATIVO' ? 'default' : 'secondary'}>
                         {processo.status}
                       </Badge>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </CardContent>
       </Card>
     </div>
   );
 }