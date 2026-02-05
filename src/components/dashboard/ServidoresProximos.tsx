 import { TrendingUp, Users } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Progress } from "@/components/ui/progress";
 import { Skeleton } from "@/components/ui/skeleton";
 import { useServidoresProximos } from "@/hooks/useDashboard";
 import { useNavigate } from "react-router-dom";
 
 const DIAS_QUINQUENIO = 1826;
 
 export function ServidoresProximos() {
   const { data: servidores, isLoading } = useServidoresProximos();
   const navigate = useNavigate();
 
   return (
     <Card>
       <CardHeader className="flex flex-row items-center gap-2">
         <TrendingUp className="h-5 w-5 text-success" />
         <CardTitle className="text-lg font-semibold">Próximos ao Deferimento</CardTitle>
       </CardHeader>
       <CardContent>
         {isLoading ? (
           <div className="space-y-4">
             {Array.from({ length: 5 }).map((_, i) => (
               <Skeleton key={i} className="h-12 w-full" />
             ))}
           </div>
         ) : servidores?.length === 0 ? (
           <div className="text-center py-8">
             <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
             <p className="text-muted-foreground">Nenhum servidor próximo</p>
           </div>
         ) : (
           <div className="space-y-4">
             {servidores?.map((servidor, index) => {
               const progresso = ((DIAS_QUINQUENIO - (servidor?.diasRestantes || 0)) / DIAS_QUINQUENIO) * 100;
               return (
                 <div 
                   key={servidor?.matricula} 
                   className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2"
                   onClick={() => navigate(`/servidores/${servidor?.matricula}`)}
                 >
                   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                     {index + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-1">
                       <div className="truncate">
                         <span className="font-medium text-sm">{servidor?.nome}</span>
                         <span className="text-xs text-muted-foreground ml-2">
                           Mat: {servidor?.matricula}
                         </span>
                       </div>
                       <span className="text-xs font-medium text-muted-foreground">
                         {servidor?.diasRestantes} dias
                       </span>
                     </div>
                     <Progress value={Math.min(progresso, 100)} className="h-2" />
                   </div>
                 </div>
               );
             })}
           </div>
         )}
       </CardContent>
     </Card>
   );
 }
