 import { useState, useMemo } from "react";
 import { useNavigate } from "react-router-dom";
 import { Search, Filter, Eye, FileText, MoreHorizontal, X, Users } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Skeleton } from "@/components/ui/skeleton";
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
 import { useServidores } from "@/hooks/useServidores";
 import { differenceInDays, addYears } from "date-fns";
 
 const DIAS_QUINQUENIO = 1826;
 
 export default function Servidores() {
   const navigate = useNavigate();
   const [searchTerm, setSearchTerm] = useState("");
   const [showFilters, setShowFilters] = useState(false);
   const [cargoFilter, setCargoFilter] = useState("TODOS");
 
   const { data: servidores, isLoading } = useServidores(searchTerm || undefined);
 
   const servidoresComCalculo = useMemo(() => {
     if (!servidores) return [];
     const today = new Date();
     
     return servidores.map(s => {
       const admissao = new Date(s.data_admissao);
       const diasTrabalhados = differenceInDays(today, admissao);
       const quinqueniosCompletos = Math.floor(diasTrabalhados / DIAS_QUINQUENIO);
       const proximoQuinquenio = addYears(admissao, (quinqueniosCompletos + 1) * 5);
       const diasRestantes = differenceInDays(proximoQuinquenio, today);
       
       return {
         ...s,
         quinquenio: quinqueniosCompletos + 1,
         diasRestantes,
       };
     }).filter(s => cargoFilter === "TODOS" || s.cargo === cargoFilter);
   }, [servidores, cargoFilter]);
 
   const clearFilters = () => {
     setCargoFilter("TODOS");
     setSearchTerm("");
   };
 
   const hasActiveFilters = cargoFilter !== "TODOS";
 
   const cargosUnicos = useMemo(() => {
     if (!servidores) return [];
     return [...new Set(servidores.map(s => s.cargo).filter(Boolean))];
   }, [servidores]);
 
   return (
     <div className="space-y-6 animate-fade-in">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-foreground">Servidores</h1>
           <p className="text-muted-foreground">
             Busque e gerencie os servidores cadastrados no sistema
           </p>
         </div>
       </div>
 
       <Card>
         <CardContent className="pt-6">
           <div className="flex flex-col gap-4">
             <div className="flex gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                 <Input
                   placeholder="Buscar por nome, matrícula ou CPF..."
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
               </Button>
             </div>
 
             {showFilters && (
               <div className="flex flex-wrap gap-4 pt-4 border-t animate-fade-in">
                 <div className="flex-1 min-w-[200px]">
                   <label className="text-sm font-medium text-muted-foreground mb-2 block">
                     Cargo
                   </label>
                   <Select value={cargoFilter} onValueChange={setCargoFilter}>
                     <SelectTrigger>
                       <SelectValue placeholder="Todos" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="TODOS">Todos</SelectItem>
                       {cargosUnicos.map(cargo => (
                         <SelectItem key={cargo} value={cargo!}>{cargo}</SelectItem>
                       ))}
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
 
       <Card>
         <CardHeader>
           <CardTitle className="text-lg font-semibold">
             Resultados ({servidoresComCalculo.length} servidores)
           </CardTitle>
         </CardHeader>
         <CardContent>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Servidor</TableHead>
                 <TableHead>Matrícula</TableHead>
                 <TableHead>Cargo</TableHead>
                 <TableHead>Lotação</TableHead>
                 <TableHead>Quinquênio</TableHead>
                 <TableHead>Dias p/ Próximo</TableHead>
                 <TableHead className="text-right">Ações</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {isLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                   <TableRow key={i}>
                     {Array.from({ length: 7 }).map((_, j) => (
                       <TableCell key={j}>
                         <Skeleton className="h-4 w-full" />
                       </TableCell>
                     ))}
                   </TableRow>
                 ))
               ) : servidoresComCalculo.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="text-center py-10">
                     <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                     <p className="text-muted-foreground">Nenhum servidor encontrado</p>
                   </TableCell>
                 </TableRow>
               ) : (
                 servidoresComCalculo.map((servidor) => (
                   <TableRow
                     key={servidor.id}
                     className="cursor-pointer hover:bg-muted/50"
                     onClick={() => navigate(`/servidores/${servidor.matricula}`)}
                   >
                     <TableCell className="font-medium">{servidor.nome}</TableCell>
                     <TableCell>{servidor.matricula}</TableCell>
                     <TableCell className="text-sm">{servidor.cargo || "-"}</TableCell>
                     <TableCell className="text-sm max-w-[150px] truncate">{servidor.lotacao || "-"}</TableCell>
                     <TableCell>{servidor.quinquenio}º</TableCell>
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
                           ? `${servidor.diasRestantes} dias`
                           : servidor.diasRestantes < 0
                           ? `Vencido há ${Math.abs(servidor.diasRestantes)} dias`
                           : "Hoje"}
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
                 ))
               )}
             </TableBody>
           </Table>
         </CardContent>
       </Card>
     </div>
   );
 }