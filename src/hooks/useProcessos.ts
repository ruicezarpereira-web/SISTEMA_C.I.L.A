 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 export interface Processo {
   id: string;
   servidor_id: string;
   numero_processo: string;
   processo_anterior: string | null;
   data_abertura: string;
   quinquenio: number;
   status: string;
   situacao: string;
   data_publicacao: string | null;
   responsavel: string | null;
   nivel: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface ProcessoComServidor extends Processo {
   servidores: {
     nome: string;
     matricula: string;
   };
 }
 
 export function useProcessos(status?: string) {
   return useQuery({
     queryKey: ['processos', status],
     queryFn: async () => {
       let query = supabase
         .from('processos')
         .select(`
           *,
           servidores (
             nome,
             matricula
           )
         `)
         .order('data_abertura', { ascending: false });
 
       if (status) {
         query = query.eq('status', status);
       }
 
       const { data, error } = await query;
       if (error) throw error;
       return data as ProcessoComServidor[];
     },
   });
 }
 
 export function useProcessosByServidor(servidorId: string) {
   return useQuery({
     queryKey: ['processos', 'servidor', servidorId],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('processos')
         .select('*')
         .eq('servidor_id', servidorId)
         .order('quinquenio');
 
       if (error) throw error;
       return data as Processo[];
     },
     enabled: !!servidorId,
   });
 }
 
 export function useCreateProcesso() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (processo: Omit<Processo, 'id' | 'created_at' | 'updated_at'>) => {
       const { data, error } = await supabase
         .from('processos')
         .insert(processo)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['processos'] });
       toast({ title: "Processo criado com sucesso!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao criar processo", description: error.message, variant: "destructive" });
     },
   });
 }
 
 export function useUpdateProcesso() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({ id, ...processo }: Partial<Processo> & { id: string }) => {
       const { data, error } = await supabase
         .from('processos')
         .update(processo)
         .eq('id', id)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['processos'] });
       toast({ title: "Processo atualizado com sucesso!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao atualizar processo", description: error.message, variant: "destructive" });
     },
   });
 }