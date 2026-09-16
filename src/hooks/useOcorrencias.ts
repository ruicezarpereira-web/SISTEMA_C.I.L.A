import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { TipoOcorrencia } from "@/lib/quinquenio-calc";

export interface Ocorrencia {
  id: string;
  servidor_id: string;
  tipo: TipoOcorrencia | string;
  data_inicio: string;
  data_fim: string;
  dias_acrescimo: number;
  documento_referencia: string | null;
  observacoes: string | null;
  created_at: string;
}

export type NovaOcorrencia = Omit<Ocorrencia, 'id' | 'created_at' | 'dias_acrescimo'>;

export function useOcorrencias(servidorId?: string) {
  return useQuery({
    queryKey: ['ocorrencias', servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('*')
        .eq('servidor_id', servidorId!)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      return data as Ocorrencia[];
    },
    enabled: !!servidorId,
  });
}

export function useCreateOcorrencias() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ocorrencias: NovaOcorrencia[]) => {
      const { data, error } = await supabase.from('ocorrencias').insert(ocorrencias).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
      queryClient.invalidateQueries({ queryKey: ['quinquenios'] });
      toast({ title: `${variables.length} ocorrência(s) registrada(s).` });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar ocorrências", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteOcorrencia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ocorrencias').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] });
      queryClient.invalidateQueries({ queryKey: ['quinquenios'] });
      toast({ title: "Ocorrência excluída." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir ocorrência", description: error.message, variant: "destructive" });
    },
  });
}
