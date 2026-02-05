 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 export interface Afastamento {
   id: string;
   matricula: string;
   registro_unico: string | null;
   nome_servidor: string | null;
   motivo: string;
   motivo_descricao: string | null;
   documento_referencia: string | null;
   inicio_relatorio: string | null;
   fim_relatorio: string | null;
   cadastro_afastamento: string | null;
   inicio_evento: string;
   fim_evento: string;
   data_publicacao: string | null;
   cargo: string | null;
   funcao: string | null;
   gerencia: string | null;
   created_at: string;
 }
 
 export function useAfastamentosByMatricula(matricula: string) {
   return useQuery({
     queryKey: ['afastamentos', matricula],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('afastamentos')
         .select('*')
         .eq('matricula', matricula)
         .order('inicio_evento', { ascending: false });
 
       if (error) throw error;
       return data as Afastamento[];
     },
     enabled: !!matricula,
   });
 }
 
 export function useCreateAfastamentos() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (afastamentos: Omit<Afastamento, 'id' | 'created_at'>[]) => {
       const { data, error } = await supabase
         .from('afastamentos')
         .insert(afastamentos)
         .select();
 
       if (error) throw error;
       return data;
     },
     onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ['afastamentos'] });
       toast({ title: `${variables.length} afastamentos importados com sucesso!` });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao importar afastamentos", description: error.message, variant: "destructive" });
     },
   });
 }