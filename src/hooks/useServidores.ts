 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 export interface Servidor {
   id: string;
   nome: string;
   data_nascimento: string | null;
   sexo: string | null;
   matricula: string;
   registro_unico: string;
   rg: string | null;
   cpf: string | null;
   data_admissao: string;
   cargo: string | null;
   lotacao: string | null;
   vinculo: string | null;
   filiacao: string | null;
   endereco: string | null;
   telefone: string | null;
   email: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export function useServidores(search?: string) {
   return useQuery({
     queryKey: ['servidores', search],
     queryFn: async () => {
       let query = supabase
         .from('servidores')
         .select('*')
         .order('nome');
 
       if (search) {
         query = query.or(`nome.ilike.%${search}%,matricula.ilike.%${search}%,cpf.ilike.%${search}%`);
       }
 
       const { data, error } = await query;
       if (error) throw error;
       return data as Servidor[];
     },
   });
 }
 
 export function useServidor(matricula: string) {
   return useQuery({
     queryKey: ['servidor', matricula],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('servidores')
         .select('*')
         .eq('matricula', matricula)
         .single();
 
       if (error) throw error;
       return data as Servidor;
     },
     enabled: !!matricula,
   });
 }
 
 export function useCreateServidor() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (servidor: Omit<Servidor, 'id' | 'created_at' | 'updated_at'>) => {
       const { data, error } = await supabase
         .from('servidores')
         .insert(servidor)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['servidores'] });
       toast({ title: "Servidor cadastrado com sucesso!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao cadastrar servidor", description: error.message, variant: "destructive" });
     },
   });
 }
 
 export function useUpdateServidor() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({ id, ...servidor }: Partial<Servidor> & { id: string }) => {
       const { data, error } = await supabase
         .from('servidores')
         .update(servidor)
         .eq('id', id)
         .select()
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['servidores'] });
       toast({ title: "Servidor atualizado com sucesso!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao atualizar servidor", description: error.message, variant: "destructive" });
     },
   });
 }
 
 export function useDeleteServidor() {
   const queryClient = useQueryClient();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase
         .from('servidores')
         .delete()
         .eq('id', id);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['servidores'] });
       toast({ title: "Servidor excluído com sucesso!" });
     },
     onError: (error: Error) => {
       toast({ title: "Erro ao excluir servidor", description: error.message, variant: "destructive" });
     },
   });
 }