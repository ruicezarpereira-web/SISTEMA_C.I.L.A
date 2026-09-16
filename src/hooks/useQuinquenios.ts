import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DIAS_QUINQUENIO_BASE, type StatusQuinquenio } from "@/lib/quinquenio-calc";
import { addDays, parseISO, format } from "date-fns";

export interface Quinquenio {
  id: string;
  servidor_id: string;
  numero: number;
  data_inicio: string;
  data_fim_base: string;
  dias_acrescimo: number;
  data_fim_ajustada: string;
  status: StatusQuinquenio | string;
  processo_id: string | null;
  retifica_quinquenio_id: string | null;
  afetado_lc_173_2020: boolean;
  created_at: string;
  updated_at: string;
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

export function useQuinquenios(servidorId?: string) {
  return useQuery({
    queryKey: ['quinquenios', servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quinquenios')
        .select('*')
        .eq('servidor_id', servidorId!)
        .order('numero');

      if (error) throw error;
      return data as Quinquenio[];
    },
    enabled: !!servidorId,
  });
}

/** Cria o 1º quinquênio a partir da data de admissão, se ainda não existir. */
export function useCriarPrimeiroQuinquenio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ servidorId, dataAdmissao }: { servidorId: string; dataAdmissao: string }) => {
      const inicio = parseISO(dataAdmissao);
      const fimBase = addDays(inicio, DIAS_QUINQUENIO_BASE);
      const { data, error } = await supabase
        .from('quinquenios')
        .insert({
          servidor_id: servidorId,
          numero: 1,
          data_inicio: iso(inicio),
          data_fim_base: iso(fimBase),
          data_fim_ajustada: iso(fimBase),
          status: 'EM_AQUISICAO',
        })
        .select()
        .single();
      if (error) throw error;
      return data as Quinquenio;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quinquenios'] }),
    onError: (error: Error) =>
      toast({ title: "Erro ao criar quinquênio", description: error.message, variant: "destructive" }),
  });
}

/** Recalcula acréscimos e status sugerido no banco. */
export function useRecalcularQuinquenio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quinquenioId: string) => {
      const { error } = await supabase.rpc('recalcular_quinquenio', { _quinquenio_id: quinquenioId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quinquenios'] }),
    onError: (error: Error) =>
      toast({ title: "Erro ao recalcular", description: error.message, variant: "destructive" }),
  });
}

/** Alteração manual de status (deferimento/indeferimento nunca é automático). */
export function useDefinirStatusQuinquenio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      processoId,
    }: { id: string; status: StatusQuinquenio; processoId?: string | null }) => {
      const { data, error } = await supabase
        .from('quinquenios')
        .update({ status, ...(processoId !== undefined ? { processo_id: processoId } : {}) })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Quinquenio;
    },
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ['quinquenios'] });
      toast({ title: `Quinquênio marcado como ${v.status}.` });
    },
    onError: (error: Error) =>
      toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" }),
  });
}

/**
 * Retificação: preserva o registro original (status RETIFICADO) e cria um novo
 * quinquênio vinculado por retifica_quinquenio_id.
 */
export function useRetificarQuinquenio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      original,
      dataInicio,
      diasAcrescimo = 0,
    }: { original: Quinquenio; dataInicio?: string; diasAcrescimo?: number }) => {
      const inicio = parseISO(dataInicio ?? original.data_inicio);
      const fimBase = addDays(inicio, DIAS_QUINQUENIO_BASE);
      const fimAjustada = addDays(fimBase, diasAcrescimo);

      const { error: errOriginal } = await supabase
        .from('quinquenios')
        .update({ status: 'RETIFICADO' })
        .eq('id', original.id);
      if (errOriginal) throw errOriginal;

      const { data, error } = await supabase
        .from('quinquenios')
        .insert({
          servidor_id: original.servidor_id,
          numero: original.numero,
          data_inicio: iso(inicio),
          data_fim_base: iso(fimBase),
          dias_acrescimo: diasAcrescimo,
          data_fim_ajustada: iso(fimAjustada),
          status: 'EM_AQUISICAO',
          retifica_quinquenio_id: original.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Quinquenio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quinquenios'] });
      toast({ title: "Quinquênio retificado; histórico preservado." });
    },
    onError: (error: Error) =>
      toast({ title: "Erro ao retificar", description: error.message, variant: "destructive" }),
  });
}
