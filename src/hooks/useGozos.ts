import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Gozo {
  id: string;
  quinquenio_id: string;
  numero_periodo: number;
  data_inicio: string;
  data_fim: string;
  dias: number;
  observacoes: string | null;
  created_at: string;
}

export type NovoGozo = Omit<Gozo, 'id' | 'created_at'>;

export function useGozos(quinquenioId?: string) {
  return useQuery({
    queryKey: ['gozos', quinquenioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gozos')
        .select('*')
        .eq('quinquenio_id', quinquenioId!)
        .order('numero_periodo');

      if (error) throw error;
      return data as Gozo[];
    },
    enabled: !!quinquenioId,
  });
}

export function useCreateGozo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (gozo: NovoGozo) => {
      const { data, error } = await supabase.from('gozos').insert(gozo).select().single();
      if (error) throw error;
      return data as Gozo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gozos'] });
      toast({ title: "Período de gozo registrado." });
    },
    onError: (error: Error) =>
      toast({ title: "Erro ao registrar gozo", description: error.message, variant: "destructive" }),
  });
}

export function useDeleteGozo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gozos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gozos'] });
      toast({ title: "Período de gozo excluído." });
    },
    onError: (error: Error) =>
      toast({ title: "Erro ao excluir gozo", description: error.message, variant: "destructive" }),
  });
}
