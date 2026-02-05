 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 export interface Falta {
   id: string;
   matricula: string;
   nome_servidor: string | null;
   evento: string | null;
   tipo_evento: string | null;
   competencia: string | null;
   referencia: string | null;
   tipo_referencia: string | null;
   tipo_folha: string | null;
   cargo: string | null;
   situacao: string | null;
   valor: number;
   created_at: string;
 }
 
 export function useFaltasByMatricula(matricula: string) {
   return useQuery({
     queryKey: ['faltas', matricula],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('faltas')
         .select('*')
         .eq('matricula', matricula)
         .order('competencia', { ascending: false });
 
       if (error) throw error;
       return data as Falta[];
     },
     enabled: !!matricula,
   });
 }
 
 export function useCreateFaltas() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (faltas: Omit<Falta, 'id' | 'created_at'>[]) => {
       const { data, error } = await supabase
         .from('faltas')
         .insert(faltas)
         .select();
 
       if (error) throw error;
       return data;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ['faltas'] });
       toast({ title: `${variables.length} faltas importadas com sucesso!` });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao importar faltas", description: error.message, variant: "destructive" });
     },
   });
 }