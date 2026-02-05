 import { useState } from "react";
 import { Save, Settings, Users2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useToast } from "@/hooks/use-toast";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Skeleton } from "@/components/ui/skeleton";
 
 export default function Configuracoes() {
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const { data: configuracoes, isLoading } = useQuery({
     queryKey: ['configuracoes'],
     queryFn: async () => {
       const { data, error } = await supabase.from('configuracoes').select('*');
       if (error) throw error;
       return data.reduce((acc, item) => {
         acc[item.chave] = item.valor;
         return acc;
       }, {} as Record<string, string | null>);
     },
   });
 
   const { data: autoridades, isLoading: loadingAutoridades } = useQuery({
     queryKey: ['autoridades'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('autoridades')
         .select('*')
         .eq('ativo', true);
       if (error) throw error;
       return data;
     },
   });
 
   const updateConfig = useMutation({
     mutationFn: async ({ chave, valor }: { chave: string; valor: string }) => {
       const { error } = await supabase
         .from('configuracoes')
         .update({ valor })
         .eq('chave', chave);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
       toast({ title: "Configuração salva com sucesso!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
     },
   });
 
   const [formValues, setFormValues] = useState<Record<string, string>>({});
 
   const handleSave = (chave: string) => {
     const valor = formValues[chave] ?? configuracoes?.[chave] ?? '';
     updateConfig.mutate({ chave, valor });
   };
 
   if (isLoading) {
     return (
       <div className="space-y-6">
         <Skeleton className="h-8 w-48" />
         <Skeleton className="h-[400px] w-full" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6 animate-fade-in">
       <div>
         <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
         <p className="text-muted-foreground">
           Configure os parâmetros do sistema de licenças prêmio
         </p>
       </div>
 
       <Tabs defaultValue="calculos">
         <TabsList>
           <TabsTrigger value="calculos">
             <Settings className="h-4 w-4 mr-2" />
             Cálculos
           </TabsTrigger>
           <TabsTrigger value="autoridades">
             <Users2 className="h-4 w-4 mr-2" />
             Autoridades
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="calculos">
           <Card>
             <CardHeader>
               <CardTitle>Parâmetros de Cálculo</CardTitle>
               <CardDescription>
                 Configure os valores utilizados no cálculo de quinquênios
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label htmlFor="dias_quinquenio">Dias por Quinquênio</Label>
                   <div className="flex gap-2">
                     <Input
                       id="dias_quinquenio"
                       type="number"
                       defaultValue={configuracoes?.dias_quinquenio || '1826'}
                       onChange={(e) => setFormValues(prev => ({
                         ...prev,
                         dias_quinquenio: e.target.value
                       }))}
                     />
                     <Button 
                       onClick={() => handleSave('dias_quinquenio')}
                       disabled={updateConfig.isPending}
                     >
                       <Save className="h-4 w-4" />
                     </Button>
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Quantidade de dias necessários para completar um quinquênio (padrão: 1826)
                   </p>
                 </div>
 
                 <div className="space-y-2">
                   <Label htmlFor="desconto_falta">Desconto por Falta (dias)</Label>
                   <div className="flex gap-2">
                     <Input
                       id="desconto_falta"
                       type="number"
                       defaultValue={configuracoes?.desconto_falta || '1'}
                       onChange={(e) => setFormValues(prev => ({
                         ...prev,
                         desconto_falta: e.target.value
                       }))}
                     />
                     <Button 
                       onClick={() => handleSave('desconto_falta')}
                       disabled={updateConfig.isPending}
                     >
                       <Save className="h-4 w-4" />
                     </Button>
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Quantidade de dias descontados por falta
                   </p>
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="cabecalho_padrao">Cabeçalho Padrão</Label>
                 <div className="flex gap-2">
                   <Input
                     id="cabecalho_padrao"
                     defaultValue={configuracoes?.cabecalho_padrao || ''}
                     onChange={(e) => setFormValues(prev => ({
                       ...prev,
                       cabecalho_padrao: e.target.value
                     }))}
                   />
                   <Button 
                     onClick={() => handleSave('cabecalho_padrao')}
                     disabled={updateConfig.isPending}
                   >
                     <Save className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         <TabsContent value="autoridades">
           <Card>
             <CardHeader>
               <CardTitle>Autoridades Signatárias</CardTitle>
               <CardDescription>
                 Configure as autoridades que assinam os documentos
               </CardDescription>
             </CardHeader>
             <CardContent>
               {loadingAutoridades ? (
                 <Skeleton className="h-20 w-full" />
               ) : autoridades?.length === 0 ? (
                 <p className="text-muted-foreground text-center py-8">
                   Nenhuma autoridade cadastrada
                 </p>
               ) : (
                 <div className="space-y-4">
                   {autoridades?.map((auth) => (
                     <div key={auth.id} className="flex items-center justify-between p-4 border rounded-lg">
                       <div>
                         <p className="font-medium">{auth.nome}</p>
                         <p className="text-sm text-muted-foreground">{auth.cargo}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>
   );
 }